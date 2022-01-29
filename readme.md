# setup-eslint-config

This is a little utility to help manage installation of eslint configs. This
is kind of an opinionated solution to the fact that eslint needs peer dependencies
not dependencies for config uses other configs and plugins. It will install
the given list of packages with the same version that can be found in
`devDependencies` or use [@rushstack/eslint-patch][] for resolving nested
dependencies.

## Installation

```
npm install setup-eslint-config
# or
yarn add setup-eslint-config
```

## Usage


Create a file like the following example, and then add it to bin in
`package.json`. If you define it in bin as the same name as the
package you can use npx to install or upgrade it in the projects with
`npx eslint-config-relekang@latest`. See [eslint-config-relekang][] as
example.

```javascript
const {setup} = require('setup-eslint-config')

setup({
  name: "eslint-config-relekang",
  prompts: [
    { type: 'confirm', name: 'prettier', message: 'Use prettier?' },
  ],
  fileChecks: [{name: "docker": path: "Dockerfile" }],
  skipDetectedPrompts: true,
  createEslintConfig: (config) => {
      const extending = ["relekang"]
      if (config.prettier) {
        extending.push("relekang/prettier");
      }
      return {extends: extending}
  },
  createDependencyList: (config) => {
    const dependencies = ['eslint'];
    if (config.prettier) {
      dependencies.push('eslint-config-prettier');
      dependencies.push('eslint-plugin-prettier');
      dependencies.push('prettier');
    }
    return dependencies;
  }
  createNpmCommands: ({typescript}) => {
    return {
      lint: `eslint --cache ${typescript? '--ext ts,tsx,js,jsx': ''} .`,
      "lint:errors": `eslint --cache --quiet ${typescript? '--ext ts,tsx,js,jsx': ''} .`,
      format: `eslint --cache --quiet --fix ${typescript? '--ext ts,tsx,js,jsx': ''} .`,
    };
  },
}).catch(error => {
    console.error(error.message)
    process.exit(1)
})
```

The prompts property is passed on to
the [prompts][] package, thus read their documentation on available options.
The result of the prompts are passed to functions as `config`. If there is an
autodetection with the same name and `skipDetectedPrompts` is set to true then
the prompt will be skipped. See list of autodetected things below. The values of
the fields defined in the prompts will be stored in the config part of the eslint
config and then reused the next time. This will also happen if it is detected.


### Using relative resolver patch

[@rushstack/eslint-patch][] is a package that allows using plugins and configs
as nested dependencies so we don't need to have the plugins used in the config
as direct dependencies in the project. To enable this it is required to use
eslint config as a js file so that we can add the import of the patch. Set
`useEslintRelativePathPatch: true` in the config. Then you can omit `createDependencyList`. It is important when using this option to add plugins and
configs to dependencies and not devDependencies.

## Specifying version when using npx

Since npx sometimes chooses the installed version even when version is
specified this library supports first argument to be the wanted version:

```
npx eslint-config-relekang latest
npx eslint-config-relekang 2.0.0
```

#### Autodetection

* yarn - is there a yarn.lock file in the directory
* babel - is there a .babelrc file in the directory
* typescript - is typescript a dependency or is there a tsconfig.json file in the directory
* flowtype - is there a .flowconfig file in the directory
* vue - is vue a dependency or dev dependency
* react - is react a dependency or dev dependency
* prettier - is prettier a dependency or dev dependency
* jest - is jest a dependency or dev dependency
* mocha - is mocha a dependency or dev dependency
* ava - is ava a dependency or dev dependency
* cypress - is cypress a dependency or dev dependency
* node - eslintConfig.env.node is true


[prompts]: https://www.npmjs.com/package/prompts
[eslint-config-relekang]: https://github.com/relekang/eslint-config-relekang
[@rushstack/eslint-patch]: https://www.npmjs.com/package/@rushstack/eslint-patch
