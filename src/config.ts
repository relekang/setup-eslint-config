import execa from "execa";
import { ConfigOptions, SetupConfig } from "./types";
import { writeConfig } from "./files";
import { Linter } from "eslint";
import { pick } from "./utils";

export function updateEslintConfig({
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
  return async () => {
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
  };
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
  return async () => {
    if (config.yarn) {
      return execa("yarn", ["add", "--dev", ...config.dependencies]);
    }
    return execa("npm", ["install", "--save-dev", ...config.dependencies]);
  };
}

export function createInstallConfigTask({
  setupConfig,
  options,
  argv,
  env,
}: {
  setupConfig: SetupConfig;
  options: ConfigOptions;
  argv: string[];
  env: Record<string, string | undefined>;
}) {
  const npx = env.npm_lifecycle_event === "npx";
  let version = setupConfig.packageInfo.version;
  if (npx && argv[1].includes("@")) {
    version = argv[1].split("@")[1];
  } else if (argv.length === 3) {
    version = argv[2];
  }

  return {
    title: `Installing ${setupConfig.packageInfo.name}@${version}`,
    task: install({
      ...options,
      dependencies: [`${setupConfig.packageInfo.name}@${version}`],
    }),
    skip: !npx,
  };
}

export function updateCommands({
  setupConfig,
  options,
}: {
  setupConfig: SetupConfig;
  options: ConfigOptions;
}) {
  return async () => {
    const commands = setupConfig.createNpmCommands
      ? setupConfig.createNpmCommands(options)
      : {};
    for (const key in commands) {
      const command = commands[key];
      if (key && command) {
        await execa("npm", ["set-script", key, command]);
      }
    }
  };
}
