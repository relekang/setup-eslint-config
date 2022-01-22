import { createInstallConfigTask } from "../config";

describe("createInstallConfigTask", () => {
  it("should create task with specific version as argument", () => {
    const task = createInstallConfigTask({
      // @ts-expect-error test data
      options: {},
      // @ts-expect-error test data
      setupConfig: {
        packageInfo: { name: "eslint-config-party", version: "1.0.0" },
      },
      argv: ["npx", "eslint-config-party", "4.2.0"],
      env: { npm_lifecycle_event: "npx" },
    });
    expect(task.title).toEqual("Installing eslint-config-party@4.2.0");
    expect(task.skip).toEqual(false);
  });

  it("should create task with specific version", () => {
    const task = createInstallConfigTask({
      // @ts-expect-error test data
      options: {},
      // @ts-expect-error test data
      setupConfig: {
        packageInfo: { name: "eslint-config-party", version: "1.0.0" },
      },
      argv: ["npx", "eslint-config-party@4.2.0"],
      env: { npm_lifecycle_event: "npx" },
    });
    expect(task.title).toEqual("Installing eslint-config-party@4.2.0");
    expect(task.skip).toEqual(false);
  });

  it("should create task with latest version", () => {
    const task = createInstallConfigTask({
      // @ts-expect-error test data
      options: {},
      // @ts-expect-error test data
      setupConfig: {
        packageInfo: { name: "eslint-config-party", version: "1.0.0" },
      },
      argv: ["npx", "eslint-config-party@latest"],
      env: { npm_lifecycle_event: "npx" },
    });
    expect(task.title).toEqual("Installing eslint-config-party@latest");
    expect(task.skip).toEqual(false);
  });

  it("should create task without version", () => {
    const task = createInstallConfigTask({
      // @ts-expect-error test data
      options: {},
      // @ts-expect-error test data
      setupConfig: {
        packageInfo: { name: "eslint-config-party", version: "1.0.0" },
      },
      argv: ["npx", "eslint-config-party"],
      env: { npm_lifecycle_event: "npx" },
    });
    expect(task.title).toEqual("Installing eslint-config-party@1.0.0");
    expect(task.skip).toEqual(false);
  });

  it("should create skip task", () => {
    const task = createInstallConfigTask({
      // @ts-expect-error test data
      options: {},
      // @ts-expect-error test data
      setupConfig: {
        packageInfo: { name: "eslint-config-party", version: "1.0.0" },
      },
      argv: ["npx", "eslint-config-party"],
      env: {},
    });
    expect(task.skip).toEqual(true);
  });
});
