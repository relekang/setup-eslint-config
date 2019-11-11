const { createConfig } = require('../');

test('createConfig with node set in current config', async () => {
  const setupConfig = {
    prompts: [],
    createDependencyList: () => ['eslint'],
    packageInfo: { devDependencies: { eslint: '^42' } },
  };

  expect(
    await createConfig(setupConfig, { env: { node: true } })
  ).toMatchSnapshot();
});

test('createConfig without env in current config', async () => {
  const setupConfig = {
    prompts: [],
    createDependencyList: () => ['eslint'],
    packageInfo: { devDependencies: { eslint: '^42' } },
  };

  expect(await createConfig(setupConfig, {})).toMatchSnapshot();
});
