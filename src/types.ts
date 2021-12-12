import { Linter } from "eslint";
import prompts from "prompts";

export interface ConfigOptions {
  yarn: boolean;
  babel: boolean;
  typescript: boolean;
  flowtype: boolean;
  react: boolean;
  vue: boolean;
  prettier: boolean;
  jest: boolean;
  mocha: boolean;
  ava: boolean;
  cypress: boolean;
  node: boolean;
  dependencies: string[];
}

export interface PackageInfo {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface SetupConfig {
  name: string;
  prompts: prompts.PromptObject[];
  skipDetectedPrompts?: boolean;
  packageInfo: PackageInfo;
  createEslintConfig: (
    config: Omit<ConfigOptions, "dependencies">
  ) => Linter.Config;
  createDependencyList: (
    config: Omit<ConfigOptions, "dependencies">
  ) => string[];
}
