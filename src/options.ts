import fs from "fs";
import path from "path";
import prompts from "prompts";
import { promisify } from "util";
import { ConfigOptions, PackageInfo, PromptObject, SetupConfig } from "./types";
import { exists } from "./files";
import { dependencyString, hasDependency, oneOf } from "./utils";
import { Linter } from "eslint";
import _debug from "debug";

const debug = _debug("setup-eslint-config:options");

const readFile = promisify(fs.readFile);

export async function buildOptions(
  setupConfig: SetupConfig,
  currentConfig: Linter.Config
): Promise<ConfigOptions> {
  const cwd = process.cwd();
  const packageInfo = JSON.parse(
    (await readFile(path.resolve(cwd, "package.json"))).toString()
  ) as unknown as PackageInfo;
  const storedOptions = (
    currentConfig.settings ? currentConfig.settings[setupConfig.name] : {}
  ) as Record<string, boolean>;

  debug({ storedOptions });
  const detected: Omit<ConfigOptions, "dependencies" | "features"> = {
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
    ...storedOptions,
  };

  debug({ detected });

  const fileChecks = (
    await Promise.all(
      (setupConfig.fileChecks || []).map(async (check) => ({
        name: check.name,
        exists: await exists(path.resolve(cwd, check.path)),
      }))
    )
  ).reduce<Record<string, boolean>>((checks, { name, exists }) => {
    checks[name] = exists;
    return checks;
  }, {});

  debug({ fileChecks });

  const detectedKeys = [...Object.keys(detected), ...Object.keys(fileChecks)];

  const promptsConfig = setupConfig.skipDetectedPrompts
    ? setupConfig.prompts.map(
        (prompt: PromptObject): PromptObject => ({
          ...prompt,
          type: detectedKeys.includes(prompt.name) ? null : prompt.type,
        })
      )
    : setupConfig.prompts;
  const answers = await prompts(promptsConfig);
  debug({ answers });
  const features = promptsConfig.map(({ name }) => name);
  debug({ features });
  const options: ConfigOptions = {
    ...detected,
    ...answers,
    features,
    dependencies: (setupConfig.createDependencyList
      ? setupConfig.createDependencyList({
          ...detected,
          ...answers,
          features,
        })
      : ["eslint"]
    )
      .concat([
        ...(setupConfig.useEslintRelativePathPatch
          ? ["@rushstack/eslint-patch"]
          : []),
      ])
      .map(dependencyString(setupConfig.packageInfo)),
  };
  debug({ options });
  return options;
}
