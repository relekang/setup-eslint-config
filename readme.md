# setup-eslint-config

## Installation

```
npm install setup-eslint-config
# or
yarn add setup-eslint-config
```

## Usage

```javascript
const {setup} = require('setup-eslint-config')

setup({
  name: "eslint-config-relekang",
  prompts: [
    { type: 'confirm', name: 'prettier', message: 'Use prettier?' },
  ],
  createEslintConfig: (config) => {
      const extending = ["relekang"]
      if (config.prettier) {
        extending.push("relekang/prettier");
      }
      return {extends: extending}
  },
  createDependencyList: (config) => {
    const dependencies = [dependencyString('eslint')];
    if (config.prettier) {
      dependencies.push(dependencyString('eslint-config-prettier'));
      dependencies.push(dependencyString('eslint-plugin-prettier'));
      dependencies.push('prettier@latest');
    }
    return dependencies;
  }
}).catch(error => {
    console.error(error.message)
    process.exit(1)
})
```
