import {
  getOption,
  InferType,
  makeSchema,
  refineWithMetainformation,
  Schema,
} from "./schema";
import { isFailure, isSuccess, Validation } from "./validation";

type optionalKeys<T> = {
  [k in keyof T]-?: undefined extends T[k] ? k : never;
}[keyof T];
type requiredKeys<T> = {
  [k in keyof T]: undefined extends T[k] ? never : k;
}[keyof T];
export type fixPartialKeys<T> = optionalKeys<T> extends never
  ? T
  : { [k in requiredKeys<T>]: T[k] } & { [k in optionalKeys<T>]?: T[k] };

export function object<T extends { [K in keyof T]: Schema<unknown, unknown> }>(
  schema: T
): Schema<
  fixPartialKeys<{ [K in keyof T]: InferType<T[K]> }>,
  { type: "object"; schema: { [K in keyof T]: T[K] } }
> {
  type ResultT = fixPartialKeys<{ [K in keyof T]: InferType<T[K]> }>;

  const validate: Schema<ResultT, unknown>["validate"] = (v, o) => {
    if (typeof v !== "object") {
      return "value should be an object" as Validation<ResultT>;
    }
    if (v === null) {
      return "value should not be null" as Validation<ResultT>;
    }

    const validation: { [key: string]: unknown } = {};
    for (const [key, inner] of Object.entries(schema)) {
      const innerValidation = (inner as Schema<unknown, unknown>).validate(
        (v as { [k: string]: unknown })[key]
      );
      if (isFailure(innerValidation)) {
        validation[key] = innerValidation;
        if (getOption(o, "earlyExit")) {
          return validation as Validation<ResultT>;
        }
      }
    }
    if (Object.keys(validation).length === 0) {
      return;
    }
    return validation as Validation<ResultT>;
  };
  return {
    accepts: (v): v is ResultT => isSuccess(validate(v, { earlyExit: true })),
    validate,
    parse: (v, o) => {
      const validation = validate(v, o);
      if (isFailure(validation)) {
        throw validation;
      }
      if (!getOption(o, "strip")) {
        return v as ResultT;
      }
      const result: Partial<ResultT> = {};
      for (const key of Object.keys(schema)) {
        result[key] = (v as ResultT)[key as keyof ResultT];
      }
      return result as ResultT;
    },
    meta: () => ({ type: "object", schema }),
  };
}

export function empty(): Schema<Record<string, never>, { type: "object" }> {
  return object({});
}

export function fromInstance<T>(
  constructor: {
    new (...args: unknown[]): T;
  },
  message?: string
): Schema<T, { type: "object"; instance: string }> {
  return makeSchema(
    (v) => {
      const isValid = v instanceof constructor;
      if (!isValid) {
        return (message ||
          "value should be instanceof the given constructor") as Validation<T>;
      }
    },
    () => ({ type: "object", instance: constructor.name })
  );
}

export function isInstance<T, M>(
  schema: Schema<T, M>,
  constructor: { new (...args: unknown[]): T }
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      const isValid = v instanceof constructor;
      if (!isValid) {
        return "value should be instanceof the given constructor" as Validation<T>;
      }
    },
    { instance: constructor.name }
  );
}

export function omit<
  T,
  M extends { schema: { [K in keyof T]: Schema<T[K], unknown> } },
  K extends keyof T
>(
  schema: Schema<T, M>,
  ...keys: K[]
): Schema<
  {
    [Key in keyof T as Key extends K ? never : Key]: T[Key];
  },
  {
    type: "object";
    schema: Omit<M["schema"], K>;
  }
> {
  const filteredSchemas = {};
  for (const [key, value] of Object.entries(schema.meta().schema)) {
    if (!keys.includes(key as K)) {
      filteredSchemas[key] = value;
    }
  }

  return makeSchema(
    (v) => {
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
    },
    () => ({
      type: "object",
      schema: filteredSchemas as Omit<M["schema"], K>,
    })
  );
}

export function pick<
  T,
  M extends { schema: { [K in keyof T]: Schema<T[K], unknown> } },
  K extends keyof T
>(
  schema: Schema<T, M>,
  ...keys: K[]
): Schema<
  { [key in K]: T[key] },
  { type: "object"; schema: { [key in K]: M["schema"][key] } }
> {
  const filteredSchemas = {};
  for (const [key, value] of Object.entries(schema.meta().schema)) {
    if (keys.includes(key as K)) {
      filteredSchemas[key] = value;
    }
  }

  return makeSchema(
    (v) => {
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
    },
    () => ({
      type: "object",
      schema: filteredSchemas as { [key in K]: M["schema"][key] },
    })
  );
}

export function at<
  T,
  M extends { schema: { [K in keyof T]: Schema<T[K], unknown> } },
  K extends keyof T
>(
  schema: Schema<T, M>,
  key: K
): Schema<T[K], ReturnType<M["schema"][K]["meta"]>> {
  return makeSchema(
    (v) => {
      const validation = schema.validate({ [key]: v });
      if (validation === undefined) {
        return;
      }
      return validation[key as string] as Validation<T[K]>;
    },
    () => schema.meta().schema[key].meta() as ReturnType<M["schema"][K]["meta"]>
  );
}
