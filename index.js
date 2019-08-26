const fs = require('fs');
const path = require('path');
const prompts = require('prompts');
const Listr = require('listr');
const execa = require('execa');
const yaml = require('js-yaml');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const access = promisify(fs.access);

async function setup(setupConfig) {
  const config = await createConfig(setupConfig);
  const tasks = new Listr([
    {
      title: `Installing dependencies ${config.dependencies.join(' ')}`,
      task: () => install(config),
    },
    {
      title: 'Creating configuration',
      task: () => updateEslintConfig(setupConfig, config),
    },
  ]);
  await tasks.run();
}

async function createConfig(setupConfig) {
  const detected = {
    yarn: await exists(path.resolve(process.cwd(), 'yarn.lock')),
    babel: await exists(path.resolve(process.cwd(), '.babelrc')),
    typescript: await exists(path.resolve(process.cwd(), 'tsconfig.json')),
    flowtype: await exists(path.resolve(process.cwd(), '.flowconfig')),
    react: await hasDependency(setupConfig.packageInfo, 'react'),
    vue: await hasDependency(setupConfig.packageInfo, 'vue'),
    prettier: await hasDependency(setupConfig.packageInfo, 'prettier'),
    jest: await hasDependency(setupConfig.packageInfo, 'jest'),
  };
  const detectedKeys = Object.keys(detected);

  const promptsConfig = setupConfig.skipDetectedPrompts
    ? setupConfig.prompts.filter(prompt => !detectedKeys.includes(prompt.name))
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

function updateEslintConfig(setupConfig, config) {
  const generatedConfig = setupConfig.createEslintConfig(config);
  const filename =
    require(path.resolve(process.cwd(), 'package.json')).name ===
    setupConfig.name
      ? '.eslintrc.test'
      : '.eslintrc';
  const configPath = path.join(process.cwd(), filename);
  let currentConfig;
  try {
    currentConfig = fs.readFileSync(configPath);
  } catch (error) {
    currentConfig = '---';
  }
  try {
    currentConfig = yaml.safeLoad(currentConfig);
  } catch (error) {
    currentConfig = JSON.parse(currentConfig);
  }

  writeFile(
    configPath,
    `---\n${yaml.safeDump(mergeConfigs(currentConfig, generatedConfig))}`
  );
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
