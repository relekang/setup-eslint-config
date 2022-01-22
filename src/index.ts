import { Listr } from "listr2";
import _debug from "debug";
import path from "path";

import { SetupConfig } from "./types";
import { loadCurrentConfig } from "./files";
import {
  createInstallConfigTask,
  install,
  updateCommands,
  updateEslintConfig,
} from "./config";
import { buildOptions } from "./options";

import { DebugRenderer } from "./listr";

const debug = _debug("setup-eslint-config:index");

export async function setup(setupConfig: SetupConfig) {
  const { prefix, currentConfig } = await loadCurrentConfig(setupConfig);
  const options = await buildOptions(setupConfig, currentConfig);
  debug("setup-eslint-config:Creating tasks");
  debug({
    path: path.resolve(__dirname),
    packageInfo: setupConfig.packageInfo,
  });
  const tasks = new Listr(
    [
      createInstallConfigTask({
        setupConfig,
        options,
        argv: process.argv,
        env: process.env,
      }),
      {
        title: "Creating configuration",
        task: updateEslintConfig({
          setupConfig,
          options,
          currentConfig,
          prefix,
        }),
      },
      {
        title: "Update npm commands",
        task: updateCommands({ setupConfig, options }),
        skip: !setupConfig.createNpmCommands,
      },
      {
        title: `Installing dependencies ${options.dependencies.toString()}`,
        task: install(options),
      },
    ],
    { renderer: process.env.DEBUG ? DebugRenderer : "default" }
  );
  await tasks.run();
}
