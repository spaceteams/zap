import { getOption, makeSchema, refine, Schema } from "./schema";
import { isFailure, isSuccess, Validation } from "./validation";

type optionalKeys<T> = {
  [k in keyof T]-?: undefined extends T[k] ? k : never;
}[keyof T];
type requiredKeys<T> = {
  [k in keyof T]: undefined extends T[k] ? never : k;
}[keyof T];
type fixPartialKeys<T> = optionalKeys<T> extends never
  ? T
  : { [k in requiredKeys<T>]: T[k] } & { [k in optionalKeys<T>]?: T[k] };

export function object<T>(schema: {
  [K in keyof T]: Schema<T[K]>;
}): Schema<fixPartialKeys<T>> {
  const validate: Schema<fixPartialKeys<T>>["validate"] = (v, o) => {
    if (typeof v !== "object") {
      return "value should be an object" as Validation<T>;
    }
    if (v === null) {
      return "value should not be null" as Validation<T>;
    }

    const validation: { [key: string]: unknown } = {};
    for (const [key, inner] of Object.entries(schema)) {
      const innerValidation = (inner as Schema<unknown>).validate(
        (v as { [k: string]: unknown })[key]
      );
      if (isFailure(innerValidation)) {
        validation[key] = innerValidation;
        if (getOption(o, "earlyExit")) {
          return validation as Validation<T>;
        }
      }
    }
    if (Object.keys(validation).length === 0) {
      return;
    }
    return validation as Validation<T>;
  };
  return {
    accepts: (v): v is T => isSuccess(validate(v, { earlyExit: true })),
    validate,
    parse: (v, o) => {
      const validation = validate(v, o);
      if (isFailure(validation)) {
        throw validation;
      }
      if (!getOption(o, "strip")) {
        return v as T;
      }
      const result: Partial<T> = {};
      for (const key of Object.keys(schema)) {
        result[key] = (v as T)[key as keyof T];
      }
      return result as T;
    },
  };
}

export function empty(): Schema<Record<string, never>> {
  return object({});
}

export function fromInstance<T>(
  constructor: {
    new (...args: unknown[]): T;
  },
  message?: string
): Schema<T> {
  return makeSchema((v) => {
    const isValid = v instanceof constructor;
    if (!isValid) {
      return (message ||
        "value should be instanceof the given constructor") as Validation<T>;
    }
  });
}

export function isInstance<T>(
  schema: Schema<T>,
  constructor: { new (...args: unknown[]): T }
): Schema<T> {
  return refine(schema, (v) => {
    const isValid = v instanceof constructor;
    if (!isValid) {
      return "value should be instanceof the given constructor" as Validation<T>;
    }
  });
}

export function omit<T, K extends keyof T>(
  schema: Schema<T>,
  ...keys: K[]
): Schema<{
  [Key in keyof T as Key extends K ? never : Key]: T[Key];
}> {
  return makeSchema((v) => {
    const validation = schema.validate(v);
    if (validation === undefined) {
      return validation;
    }

    const filteredValidation: { [key: string]: unknown } = {};
    for (const [key, value] of Object.entries(validation)) {
      if (!keys.includes(key as K)) {
        filteredValidation[key] = value;
      }
    }
    if (Object.keys(filteredValidation as object).length === 0) {
      return;
    }
    return validation;
  });
}

export function pick<T, K extends keyof T>(
  schema: Schema<T>,
  ...keys: K[]
): Schema<{ [key in K]: T[key] }> {
  return makeSchema((v) => {
    const validation = schema.validate(v);
    if (validation === undefined) {
      return validation;
    }

    const filteredValidation: { [key: string]: unknown } = {};
    for (const [key, value] of Object.entries(validation)) {
      if (keys.includes(key as K)) {
        filteredValidation[key] = value;
      }
    }
    if (Object.keys(filteredValidation as object).length === 0) {
      return;
    }
    return validation;
  });
}

export function at<T, K extends keyof T>(
  schema: Schema<T>,
  key: K
): Schema<T[K]> {
  return makeSchema((v) => {
    const validation = schema.validate({ [key]: v });
    if (validation === undefined) {
      return;
    }
    return validation[key as string] as Validation<T[K]>;
  });
}
