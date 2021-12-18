import { Listr } from "listr2";
import { SetupConfig } from "./types";
import { loadCurrentConfig } from "./files";
import { install, updateEslintConfig } from "./config";
import { buildOptions } from "./options";
import _debug from "debug";
import { DebugRenderer } from "./listr";

const debug = _debug("setup-eslint-config:index");

export async function setup(setupConfig: SetupConfig) {
  const { prefix, currentConfig } = await loadCurrentConfig(setupConfig);
  const options = await buildOptions(setupConfig, currentConfig);
  debug("setup-eslint-config:Creating tasks");
  const tasks = new Listr(
    [
      {
        title: `Installing ${setupConfig.packageInfo.name}@${setupConfig.packageInfo.version}`,
        task: () =>
          install({
            ...options,
            dependencies: [
              `${setupConfig.packageInfo.name}@${setupConfig.packageInfo.version}`,
            ],
          }),
        skip: process.env.npm_lifecycle_event !== "npx",
      },
      {
        title: "Creating configuration",
        task: () =>
          updateEslintConfig({ setupConfig, options, currentConfig, prefix }),
      },
      {
        title: `Installing dependencies ${options.dependencies.toString()}`,
        task: () => install(options),
      },
    ],
    { renderer: process.env.DEBUG ? DebugRenderer : "default" }
  );
  await tasks.run();
}
