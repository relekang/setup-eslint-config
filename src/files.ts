import path from "path";
import fs from "fs";
import { promisify } from "util";
import yaml from "js-yaml";
import { PackageInfo, SetupConfig } from "./types";
import { Linter } from "eslint";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const access = promisify(fs.access);

export async function loadCurrentConfig(setupConfig: SetupConfig) {
  let prefix = "";
  let currentConfig: Linter.Config;
  const configPath = getConfigPath(setupConfig);
  let configString;
  try {
    configString = (await readFile(configPath)).toString();
  } catch (error) {
    configString = "---";
  }
  try {
    currentConfig = yaml.load(configString) as Linter.Config;
  } catch (error) {
    const rawConfig = await readFile(configPath);
    prefix = rawConfig.slice(0, rawConfig.indexOf("module.exports")).toString();
    currentConfig = require(configPath) as Linter.Config;
  }
  return { prefix, currentConfig };
}

export async function writeConfig({
  setupConfig,
  config,
  prefix,
}: {
  setupConfig: SetupConfig;
  config: Linter.Config;
  prefix: string;
}) {
  const configPath = getConfigPath(setupConfig);

  if (configPath.endsWith(".js")) {
    await writeFile(
      configPath,
      `${prefix.trim()}\nmodule.exports = ${JSON.stringify(config, null, 2)}`
    );
  } else {
    await writeFile(
      configPath,
      `---\n${yaml.dump(config, { quotingType: '"' })}`
    );
  }
}

function getConfigPath(setupConfig: SetupConfig) {
  const cwd = process.cwd();
  const projectPackageInfo = require(path.resolve(
    cwd,
    "package.json"
  )) as PackageInfo;
  return projectPackageInfo.name === setupConfig.name
    ? path.join(cwd, process.env.ESLINT_TEST_FILENAME || ".eslintrc.test")
    : fs.existsSync(path.join(cwd, ".eslintrc"))
    ? path.join(cwd, ".eslintrc")
    : path.join(cwd, ".eslintrc.js");
}

export async function exists(path: string) {
  try {
    await access(path);
    return true;
  } catch (error) {
    return false;
  }
}
