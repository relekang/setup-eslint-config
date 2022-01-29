#!/usr/bin/env node

// replace this with import of the package
// const { setup } = require("setup-eslint-config");
require("ts-node/register");
const { setup } = require("./src");

const packageInfo = require("./package.json");

async function test(filename) {
  console.log("\n", filename);
  process.env.ESLINT_TEST_FILENAME = filename;
  await setup({
    name: "setup-eslint-config",
    prompts: [
      { type: "confirm", name: "prettier", message: "Use prettier?" },
      { type: "confirm", name: "day", message: "Having a nice day?" },
    ],
    fileChecks: [
      { name: "license", path: "license" },
      { name: "test", path: "test" },
    ],
    skipDetectedPrompts: true,
    packageInfo,
    useEslintRelativePathPatch: filename.includes(".js"),
    createEslintConfig: (config) => {
      const extending = ["relekang"];
      if (config.prettier) {
        extending.push("relekang/prettier");
      }
      return { extends: extending };
    },
    createDependencyList: filename.includes(".js")
      ? (config) => {
          const dependencies = ["eslint"];
          if (config.prettier) {
            dependencies.push("eslint-config-prettier");
            dependencies.push("eslint-plugin-prettier");
            dependencies.push("prettier");
          }
          return dependencies;
        }
      : undefined,
    createNpmCommands: () => {
      return {
        lint: "eslint --cache .",
        "lint:errors": "eslint --cache --quiet .",
        format: "eslint --cache --quiet --fix .",
      };
    },
  });
  console.log("\n");
}

async function main() {
  await test(".eslintrc.test");
  await test(".eslintrc.test.js");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
