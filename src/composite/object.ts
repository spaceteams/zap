import {
  getOption,
  InferType,
  makeSchema,
  refineWithMetainformation,
  Schema,
} from "../schema";
import { literals } from "../simple/literal";
import { isFailure, makeIssue, Validation } from "../validation";

type optionalKeys<T> = {
  [k in keyof T]-?: undefined extends T[k] ? k : never;
}[keyof T];
type requiredKeys<T> = Exclude<keyof T, optionalKeys<T>>;
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

  return makeSchema(
    (v, o) => {
      if (typeof v !== "object") {
        return makeIssue("wrong_type", v, "object") as Validation<ResultT>;
      }
      if (v === null) {
        return makeIssue("wrong_type", v, "null") as Validation<ResultT>;
      }

      const record = v as { [k: string]: unknown };
      if (getOption(o, "strict")) {
        for (const key of Object.keys(record)) {
          if (!Object.hasOwn(schema, key)) {
            return makeIssue("additionalField", v, key) as Validation<ResultT>;
          }
        }
      }

      const validation: { [key: string]: unknown } = {};
      for (const [key, inner] of Object.entries(schema)) {
        const innerValidation = (inner as Schema<unknown, unknown>).validate(
          record[key]
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
    },
    () => ({ type: "object", schema }),
    (v, o) => {
      const result: Partial<ResultT> = {};
      for (const [key, inner] of Object.entries(schema)) {
        result[key] = (inner as Schema<unknown, unknown>).parse(
          v[key as keyof ResultT],
          o
        );
      }
      if (!getOption(o, "strip")) {
        return Object.assign(result, v) as ResultT;
      }
      return result as ResultT;
    }
  );
}

export function empty(): Schema<Record<string, never>, { type: "object" }> {
  return object({});
}

export function fromInstance<T>(constructor: {
  new (...args: unknown[]): T;
}): Schema<T, { type: "object"; instance: string }> {
  return makeSchema(
    (v) => {
      const isValid = v instanceof constructor;
      if (!isValid) {
        return makeIssue("wrong_type", v, constructor) as Validation<T>;
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
        return makeIssue("wrong_type", v, constructor) as Validation<T>;
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
    (v, o) => {
      const validation = schema.validate(v, o);
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
    (v, o) => {
      const validation = schema.validate(v, o);
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
    (v, o) => {
      const validation = schema.validate({ [key]: v }, o);
      if (validation === undefined) {
        return;
      }
      return validation[key as string] as Validation<T[K]>;
    },
    () => schema.meta().schema[key].meta() as ReturnType<M["schema"][K]["meta"]>
  );
}

export function keys<
  T,
  M extends { schema: { [K in keyof T]: Schema<unknown, unknown> } }
>(
  schema: Schema<T, M>
): Schema<keyof T, { type: "literals"; literals: (keyof T)[] }> {
  return literals(...(Object.keys(schema.meta().schema) as (keyof T)[]));
}
