export function dependencyString(packageInfo: {
  devDependencies?: Record<string, string>;
}) {
  return function (name: string) {
    if (packageInfo.devDependencies && packageInfo.devDependencies[name]) {
      return `${name}@${packageInfo.devDependencies[name]}`;
    }
    return name;
  };
}

export function hasDependency(
  packageInfo: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  },
  name: string
) {
  return (
    !!(packageInfo.dependencies || {})[name] ||
    !!(packageInfo.devDependencies || {})[name]
  );
}

export async function oneOf(
  ...array: (Promise<boolean> | boolean)[]
): Promise<boolean> {
  return (await Promise.all(array)).some((v) => v);
}

export function pick<T>(fields: string[], obj: T) {
  return fields.reduce<Record<string, unknown>>((acc, field) => {
    // @ts-expect-error ---
    acc[field] = obj[field];
    return acc;
  }, {});
}
