import fs from "fs";
import path from "path";
import prompts from "prompts";
import { promisify } from "util";
import { ConfigOptions, PackageInfo, SetupConfig } from "./types";
import { exists } from "./files";
import { dependencyString, hasDependency, oneOf } from "./utils";
import { Linter } from "eslint";

const readFile = promisify(fs.readFile);

export async function buildOptions(
  setupConfig: SetupConfig,
  currentConfig: Linter.Config
): Promise<ConfigOptions> {
  const cwd = process.cwd();
  const packageInfo = JSON.parse(
    (await readFile(path.resolve(cwd, "package.json"))).toString()
  ) as unknown as PackageInfo;
  const detected = {
    yarn: await exists(path.resolve(cwd, "yarn.lock")),
    babel: await oneOf(
      exists(path.resolve(cwd, ".babelrc")),
      exists(path.resolve(cwd, "babel.config.js"))
    ),
    typescript: await oneOf(
      hasDependency(packageInfo, "typescript"),
      exists(path.resolve(cwd, "tsconfig.json"))
    ),
    flowtype: await exists(path.resolve(cwd, ".flowconfig")),
    react: hasDependency(packageInfo, "react"),
    vue: hasDependency(packageInfo, "vue"),
    prettier: hasDependency(packageInfo, "prettier"),
    jest: await oneOf(
      hasDependency(packageInfo, "jest"),
      hasDependency(packageInfo, "@vue/cli-plugin-unit-jest")
    ),
    mocha: hasDependency(packageInfo, "mocha"),
    ava: hasDependency(packageInfo, "ava"),
    cypress: hasDependency(packageInfo, "cypress"),
    node: !!currentConfig?.env?.node,
  };
  const detectedKeys = Object.keys(detected);

  const promptsConfig = setupConfig.skipDetectedPrompts
    ? setupConfig.prompts.map(
        (prompt: prompts.PromptObject): prompts.PromptObject => ({
          ...prompt,
          type: detectedKeys.includes(prompt.name as string)
            ? null
            : prompt.type,
        })
      )
    : setupConfig.prompts;
  const answers = await prompts(promptsConfig);
  const config = {
    ...detected,
    ...answers,

    dependencies: setupConfig
      .createDependencyList({ ...detected, ...answers })
      .map(dependencyString(setupConfig.packageInfo)),
  };

  return config;
}
