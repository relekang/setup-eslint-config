const fs = require("fs");
const path = require("path");
const prompts = require("prompts");
const { Listr } = require("listr2");
const execa = require("execa");
const yaml = require("js-yaml");
const { promisify } = require("util");

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const access = promisify(fs.access);

let headerJS;
async function setup(setupConfig) {
  const currentConfig = await loadCurrentConfig(setupConfig);
  const config = await createConfig(setupConfig, currentConfig);
  const tasks = new Listr([
    {
      title: `Installing ${setupConfig.packageInfo.name}@${setupConfig.packageInfo.version}`,
      task: () =>
        install({
          ...config,
          dependencies: [
            `${setupConfig.packageInfo.name}@${setupConfig.packageInfo.version}`,
          ],
        }),
      skip: process.env.npm_lifecycle_event !== "npx",
    },
    {
      title: "Creating configuration",
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
  const cwd = process.cwd();
  const packageInfo = JSON.parse(
    await readFile(path.resolve(cwd, "package.json"))
  );
  const detected = {
    yarn: await exists(path.resolve(cwd, "yarn.lock")),
    babel: await oneOf([
      exists(path.resolve(cwd, ".babelrc")),
      exists(path.resolve(cwd, "babel.config.js")),
    ]),
    typescript: await oneOf([
      hasDependency(packageInfo, "typescript"),
      exists(path.resolve(cwd, "tsconfig.json")),
    ]),
    flowtype: await exists(path.resolve(cwd, ".flowconfig")),
    react: await hasDependency(packageInfo, "react"),
    vue: await hasDependency(packageInfo, "vue"),
    prettier: await hasDependency(packageInfo, "prettier"),
    jest: await oneOf([
      hasDependency(packageInfo, "jest"),
      hasDependency(packageInfo, "@vue/cli-plugin-unit-jest"),
    ]),
    mocha: await hasDependency(packageInfo, "mocha"),
    ava: await hasDependency(packageInfo, "ava"),
    cypress: await hasDependency(packageInfo, "cypress"),
    node: !!currentConfig && !!currentConfig.env && !!currentConfig.env.node,
  };
  const detectedKeys = Object.keys(detected);

  const promptsConfig = setupConfig.skipDetectedPrompts
    ? setupConfig.prompts.map((prompt) => ({
        ...prompt,
        type: (prev, values, _prompt) => {
          if (detectedKeys.includes(prompt.name)) {
            return null;
          }
          if (typeof prompt.type === "function") {
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

async function oneOf(array) {
  return (await Promise.all(array)).some((v) => v);
}

async function loadCurrentConfig(setupConfig) {
  let currentConfig;
  const configPath = getConfigPath(setupConfig);
  try {
    currentConfig = await readFile(configPath);
  } catch (error) {
    currentConfig = "---";
  }
  try {
    currentConfig = yaml.load(currentConfig);
  } catch (error) {
    const rawConfig = await readFile(configPath);
    headerJS = rawConfig.slice(0, rawConfig.indexOf("module.exports"));
    currentConfig = require(configPath);
  }
  return currentConfig;
}

async function updateEslintConfig(setupConfig, config, currentConfig) {
  const generatedConfig = setupConfig.createEslintConfig(config);
  const configPath = getConfigPath(setupConfig);
  const mergedConfigs = mergeConfigs(currentConfig, generatedConfig);

  if (configPath.endsWith(".js")) {
    await writeFile(
      configPath,
      `${headerJS}module.exports = ${JSON.stringify(mergedConfigs, null, 2)}`
    );
  } else {
    await writeFile(configPath, `---\n${yaml.dump(mergedConfigs)}`);
  }
}

function getConfigPath(setupConfig) {
  return require(path.resolve(process.cwd(), "package.json")).name ===
    setupConfig.name
    ? path.join(process.cwd(), ".eslintrc.test")
    : fs.existsSync(path.join(process.cwd(), ".eslintrc"))
    ? path.join(process.cwd(), ".eslintrc")
    : path.join(process.cwd(), ".eslintrc.js");
}

function mergeConfigs(current, generated) {
  return {
    ...(current ? current : {}),
    ...generated,
    env: { ...(current || {}).env, ...generated.env },
  };
}

function dependencyString(packageInfo) {
  return function (name) {
    return `${name}@${packageInfo.devDependencies[name]}`;
  };
}

function install(config) {
  if (config.yarn) {
    return execa("yarn", ["add", "--dev", ...config.dependencies]);
  }
  return execa("npm", ["install", "--save-dev", ...config.dependencies]);
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
