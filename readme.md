# setup-eslint-config

This is a little utility to help manage installation of eslint configs. This
is kind of an opinionated solution to the fact that eslint needs peer dependencies
not dependencies for config uses other configs and plugins. It will install
the given list of packages with the same version that can be found in
`devDependencies`.

## Installation

```
npm install setup-eslint-config
# or
yarn add setup-eslint-config
```

## Usage

Below is an example with the basic usage. The prompts property is passed on to
the [prompts][] package, thus read their documentation on available options.
The result of the prompts are passed to functions as `config`. If there is an
autodetection with the same name and `skipDetectedPrompts` is set to true then
the prompt will be skipped. See list of autodetected things below.

#### Autodetection

* yarn - is there a yarn.lock file in the directory
* babel - is there a .babelrc file in the directory
* typescript - is there a tsconfig.json file in the directory
* flowtype - is there a .flowconfig file in the directory
* vue - is vue a dependency or dev dependency
* react - is react a dependency or dev dependency
* prettier - is prettier a dependency or dev dependency
* jest - is jest a dependency or dev dependency

Create a file like the following example, and then add it to bin in `package.json`.

```javascript
const {setup} = require('setup-eslint-config')

setup({
  name: "eslint-config-relekang",
  prompts: [
    { type: 'confirm', name: 'prettier', message: 'Use prettier?' },
  ],
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
}).catch(error => {
    console.error(error.message)
    process.exit(1)
})
```

[prompts]: https://www.npmjs.com/package/prompts
