import execa from "execa";
import { ConfigOptions, SetupConfig } from "./types";
import { writeConfig } from "./files";
import { Linter } from "eslint";

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
  const mergedConfigs = mergeConfigs(currentConfig, generatedConfig);
  await writeConfig({ setupConfig, config: mergedConfigs, prefix });
}

export function mergeConfigs(
  current: Linter.Config,
  generated: Linter.Config
): Linter.Config {
  const env = { ...(current || {}).env, ...generated.env };
  return {
    ...(current ? current : {}),
    ...generated,
    ...(Object.keys(env).length > 0 ? { env } : {}),
  };
}

export function install(config: { yarn: boolean; dependencies: string[] }) {
  if (config.yarn) {
    return execa("yarn", ["add", "--dev", ...config.dependencies]);
  }
  return execa("npm", ["install", "--save-dev", ...config.dependencies]);
}
