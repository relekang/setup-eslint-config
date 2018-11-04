const { createConfig } = require('../');

test('createConfig', async () => {
  const setupConfig = {
    prompts: [],
    createDependencyList: () => ['eslint'],
    packageInfo: { devDependencies: { eslint: '^42' } },
  };

  expect(await createConfig(setupConfig)).toMatchSnapshot();
});
