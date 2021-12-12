#!/usr/bin/env node

// replace this with import of the package
// const { setup } = require("setup-eslint-config");
const { setup } = require("./src");

const packageInfo = require("./package.json");

setup({
  name: "setup-eslint-config",
  prompts: [
    { type: "confirm", name: "prettier", message: "Use prettier?" },
    { type: "confirm", name: "day", message: "Having a nice day?" },
  ],
  skipDetectedPrompts: true,
  packageInfo,
  createEslintConfig: (config) => {
    const extending = ["relekang"];
    if (config.prettier) {
      extending.push("relekang/prettier");
    }
    return { extends: extending };
  },
  createDependencyList: (config) => {
    const dependencies = ["eslint"];
    if (config.prettier) {
      dependencies.push("eslint-config-prettier");
      dependencies.push("eslint-plugin-prettier");
      dependencies.push("prettier");
    }
    return dependencies;
  },
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
