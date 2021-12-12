import { buildOptions } from "../options";
import { SetupConfig } from "../types";

test("buildOptions with node set in current config", async () => {
  const setupConfig: SetupConfig = {
    name: "test",
    prompts: [],
    createEslintConfig: () => ({}),
    createDependencyList: () => ["eslint"],
    packageInfo: {
      name: "test-package",
      version: "1.42.0",
      devDependencies: { eslint: "^42" },
    },
  };

  expect(
    await buildOptions(setupConfig, { env: { node: true } })
  ).toMatchSnapshot();
});

test("buildOptions without env in current config", async () => {
  const setupConfig: SetupConfig = {
    name: "test",
    prompts: [],
    createEslintConfig: () => ({}),
    createDependencyList: () => ["eslint"],
    packageInfo: {
      name: "test-package",
      version: "1.42.0",
      devDependencies: { eslint: "^42" },
    },
  };

  expect(await buildOptions(setupConfig, {})).toMatchSnapshot();
});
