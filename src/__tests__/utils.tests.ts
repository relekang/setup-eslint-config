import { dependencyString, hasDependency, oneOf } from "../utils";

describe("dependencyString", () => {
  const tests: [
    { devDependencies?: Record<string, string> },
    string,
    string
  ][] = [
    [{}, "eslint", "eslint"],
    [{ devDependencies: {} }, "eslint", "eslint"],
    [{ devDependencies: { eslint: "^42" } }, "eslint", "eslint@^42"],
  ];
  tests.forEach(([packageInfo, name, result]) => {
    it(`should return ${result} for ${JSON.stringify(
      packageInfo
    )} and ${name}`, () => {
      expect(dependencyString(packageInfo)(name)).toEqual(result);
    });
  });
});

describe("hasDependency", () => {
  const tests: [
    {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    },
    string,
    boolean
  ][] = [
    [{}, "eslint", false],
    [{ dependencies: {}, devDependencies: {} }, "eslint", false],
    [{ devDependencies: { eslint: "^42" } }, "eslint", true],
    [{ dependencies: { eslint: "^42" } }, "eslint", true],
  ];
  tests.forEach(([packageInfo, name, result]) => {
    it(`should return ${result} for ${JSON.stringify(
      packageInfo
    )} and ${name}`, () => {
      expect(hasDependency(packageInfo, name)).toEqual(result);
    });
  });
});

describe("oneOf", () => {
  it("should return true", async () => {
    expect(await oneOf(false, true)).toEqual(true);
    expect(await oneOf(false, Promise.resolve(true))).toEqual(true);
  });

  it("should return false", async () => {
    expect(await oneOf(false, false)).toEqual(false);
    expect(await oneOf(false, Promise.resolve(false))).toEqual(false);
  });
});
