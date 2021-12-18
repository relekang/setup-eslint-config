import execa from "execa";
import { ConfigOptions, SetupConfig } from "./types";
import { writeConfig } from "./files";
import { Linter } from "eslint";
import { pick } from "./utils";

export async function updateEslintConfig({
  setupConfig,
  currentConfig,
  options,
  prefix,
}: {
  setupConfig: SetupConfig;
  currentConfig: Linter.Config;
  options: ConfigOptions;
  prefix: string;
}) {
  const generatedConfig = setupConfig.createEslintConfig(options);
  const mergedConfigs = mergeConfigs(
    currentConfig,
    {
      settings: {
        [setupConfig.name]: pick(options.features, options),
      },
    },
    generatedConfig
  );
  await writeConfig({ setupConfig, config: mergedConfigs, prefix });
}

export function mergeConfigs(...configs: Linter.Config[]): Linter.Config {
  return configs.reduce<Linter.Config>((acc, config) => {
    const env = { ...acc.env, ...config.env };
    const settings = { ...acc.settings, ...config.settings };
    return {
      ...(acc ? acc : {}),
      ...config,
      ...(Object.keys(env).length > 0 ? { env } : {}),
      ...(Object.keys(settings).length > 0 ? { settings } : {}),
    };
  }, {});
}

export function install(config: { yarn: boolean; dependencies: string[] }) {
  if (config.yarn) {
    return execa("yarn", ["add", "--dev", ...config.dependencies]);
  }
  return execa("npm", ["install", "--save-dev", ...config.dependencies]);
}
