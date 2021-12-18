import { Linter } from "eslint";
import prompts from "prompts";

export interface ConfigOptions {
  features: string[];
  dependencies: string[];

  ava: boolean;
  babel: boolean;
  cypress: boolean;
  flowtype: boolean;
  jest: boolean;
  mocha: boolean;
  node: boolean;
  prettier: boolean;
  react: boolean;
  typescript: boolean;
  vue: boolean;
  yarn: boolean;
}

export interface PackageInfo {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export type PromptObject = prompts.PromptObject & { name: string };

export interface SetupConfig {
  name: string;
  prompts: PromptObject[];
  skipDetectedPrompts?: boolean;
  packageInfo: PackageInfo;
  createEslintConfig: (
    config: Omit<ConfigOptions, "dependencies">
  ) => Linter.Config;
  createDependencyList: (
    config: Omit<ConfigOptions, "dependencies">
  ) => string[];
}