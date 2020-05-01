const fs = require('fs');
const path = require('path');
const prompts = require('prompts');
const Listr = require('listr');
const execa = require('execa');
const yaml = require('js-yaml');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const access = promisify(fs.access);

async function setup(setupConfig) {
  const currentConfig = await loadCurrentConfig(setupConfig);
  const config = await createConfig(setupConfig, currentConfig);
  const tasks = new Listr([
    {
      title: 'Creating configuration',
      task: () => updateEslintConfig(setupConfig, config, currentConfig),
    },
    {
      title: `Installing dependencies ${config.dependencies}`,
      task: () => install(config),
    },
  ]);
  await tasks.run();
}

async function createConfig(setupConfig, currentConfig) {
  const packageInfo = JSON.parse(
    await readFile(path.resolve(process.cwd(), 'package.json'))
  );
  const detected = {
    yarn: await exists(path.resolve(process.cwd(), 'yarn.lock')),
    babel: await exists(path.resolve(process.cwd(), '.babelrc')),
    typescript: await exists(path.resolve(process.cwd(), 'tsconfig.json')),
    flowtype: await exists(path.resolve(process.cwd(), '.flowconfig')),
    react: await hasDependency(packageInfo, 'react'),
    vue: await hasDependency(packageInfo, 'vue'),
    prettier: await hasDependency(packageInfo, 'prettier'),
    jest:
      (await hasDependency(packageInfo, 'jest')) ||
      (await hasDependency(packageInfo, '@vue/cli-plugin-unit-jest')),
    node: !!currentConfig && !!currentConfig.env && !!currentConfig.env.node,
  };
  const detectedKeys = Object.keys(detected);

  const promptsConfig = setupConfig.skipDetectedPrompts
    ? setupConfig.prompts.map(prompt => ({
        ...prompt,
        type: (prev, values, _prompt) => {
          if (detectedKeys.includes(prompt.name)) {
            return null;
          }
          if (typeof prompt.type === 'function') {
            return prompt.type(prev, { ...detected, ...values }, _prompt);
          }
          return prompt.type;
        },
      }))
    : setupConfig.prompts;
  const answers = await prompts(promptsConfig);
  const config = {
    ...detected,
    ...answers,
  };

  config.dependencies = setupConfig
    .createDependencyList(config)
    .map(dependencyString(setupConfig.packageInfo));

  return config;
}

async function loadCurrentConfig(setupConfig) {
  let currentConfig;
  const configPath = getConfigPath(setupConfig);
  try {
    currentConfig = await readFile(configPath);
  } catch (error) {
    currentConfig = '---';
  }
  try {
    currentConfig = yaml.safeLoad(currentConfig);
  } catch (error) {
    currentConfig = JSON.parse(currentConfig);
  }
  return currentConfig;
}

async function updateEslintConfig(setupConfig, config, currentConfig) {
  const generatedConfig = setupConfig.createEslintConfig(config);
  const configPath = getConfigPath(setupConfig);

  await writeFile(
    configPath,
    `---\n${yaml.safeDump(mergeConfigs(currentConfig, generatedConfig))}`
  );
}

function getConfigPath(setupConfig) {
  const filename =
    require(path.resolve(process.cwd(), 'package.json')).name ===
    setupConfig.name
      ? '.eslintrc.test'
      : '.eslintrc';
  return path.join(process.cwd(), filename);
}

function mergeConfigs(current, generated) {
  return {
    ...(current ? current : {}),
    ...generated,
    env: { ...(current || {}).env, ...generated.env },
  };
}

function dependencyString(packageInfo) {
  return function(name) {
    return `${name}@${packageInfo.devDependencies[name]}`;
  };
}

function install(config) {
  if (config.yarn) {
    return execa('yarn', ['add', '--dev', ...config.dependencies]);
  }
  return execa('npm', ['install', '--save-dev', ...config.dependencies]);
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    return false;
  }
}

async function hasDependency(packageInfo, name) {
  return (
    !!(packageInfo.dependencies || {})[name] ||
    !!(packageInfo.devDependencies || {})[name]
  );
}

module.exports = { setup, createConfig };
