import { RefineContext, refineWithMetainformation } from "../refine";
import {
  getOption,
  InferOutputType,
  InferType,
  makeSchema,
  makeSimpleSchema,
  Schema,
} from "../schema";
import { literals } from "../simple/literal";
import {
  isFailure,
  ValidationIssue,
  Validation,
  isSuccess,
  ValidationResult,
} from "../validation";

type optionalKeys<T> = {
  [k in keyof T]-?: undefined extends T[k] ? k : never;
}[keyof T];
type requiredKeys<T> = Exclude<keyof T, optionalKeys<T>>;
export type fixPartialKeys<T> = optionalKeys<T> extends never
  ? T
  : { [k in requiredKeys<T>]: T[k] } & { [k in optionalKeys<T>]?: T[k] };

export function object<
  T extends { [K in keyof T]: Schema<unknown, unknown, unknown> }
>(
  schema: T,
  issues?: Partial<{
    required: string;
    wrongType: string;
  }>
): Schema<
  fixPartialKeys<{ [K in keyof T]: InferType<T[K]> }>,
  fixPartialKeys<{ [K in keyof T]: InferOutputType<T[K]> }>,
  {
    type: "object";
    schema: { [K in keyof T]: T[K] };
    additionalProperties: true;
  }
> {
  type ResultI = fixPartialKeys<{ [K in keyof T]: InferType<T[K]> }>;
  type ResultO = fixPartialKeys<{ [K in keyof T]: InferOutputType<T[K]> }>;
  type V = ValidationResult<ResultI>;

  const preValidate = (v: unknown) => {
    if (typeof v === "undefined" || v === null) {
      return new ValidationIssue("required", issues?.required, v) as V;
    }
    if (typeof v !== "object") {
      return new ValidationIssue(
        "wrong_type",
        issues?.wrongType,
        v,
        "object"
      ) as V;
    }
  };

  class Aggregator {
    constructor(readonly earlyExit: boolean) {}

    public readonly validations: { [key: string]: unknown } = {};

    onValidate(key: string, validation: ValidationResult<unknown>): boolean {
      if (isSuccess(validation)) {
        return false;
      }
      this.validations[key] = validation;
      return this.earlyExit && isFailure(validation);
    }
    result(): V {
      if (Object.keys(this.validations).length === 0) {
        return undefined;
      }
      return this.validations as V;
    }
  }

  return makeSchema(
    (v, o) => {
      const validation = preValidate(v);
      if (isFailure(validation)) {
        return validation;
      }

      const aggregator = new Aggregator(getOption(o, "earlyExit"));
      const record = v as { [k: string]: unknown };
      for (const [key, inner] of Object.entries(schema)) {
        const validation = (inner as Schema<unknown>).validate(record[key], o);
        if (aggregator.onValidate(key, validation)) {
          break;
        }
      }
      return aggregator.result();
    },
    async (v, o) => {
      const validation = preValidate(v);
      if (isFailure(validation)) {
        return validation;
      }

      const aggregator = new Aggregator(getOption(o, "earlyExit"));
      const record = v as { [k: string]: unknown };
      for (const [key, inner] of Object.entries(schema)) {
        const validation = await (inner as Schema<unknown>).validateAsync(
          record[key],
          o
        );
        if (aggregator.onValidate(key, validation)) {
          break;
        }
      }
      return aggregator.result();
    },
    () => ({ type: "object", schema, additionalProperties: true }),
    (v, o) => {
      const result: Partial<ResultO> = {};
      for (const [key, inner] of Object.entries(schema)) {
        result[key] = (inner as Schema<unknown>).parse(
          v[key as keyof ResultI],
          o
        ).parsedValue;
      }
      if (!getOption(o, "strip")) {
        for (const [key, inner] of Object.entries(v)) {
          if (!(key in result)) {
            result[key] = inner;
          }
        }
      }
      return result as ResultO;
    }
  );
}

export function strict<
  I extends { [K in keyof I]: unknown },
  O,
  M extends {
    schema: { [K in keyof I]: Schema<unknown> };
  }
>(schema: Schema<I, O, M>, issue?: string) {
  return refineWithMetainformation(
    schema,
    (v) => {
      for (const key of Object.keys(v)) {
        if (!Object.hasOwn(schema.meta().schema, key)) {
          return new ValidationIssue(
            "additionalProperty",
            issue,
            v,
            key
          ) as Validation<I>;
        }
      }
    },
    { additionalProperties: false as const }
  );
}

export function catchAll<
  I extends { [K in keyof I]: unknown },
  O,
  M extends { type: "object"; schema: { [K in keyof I]: Schema<unknown> } },
  J,
  P,
  N
>(schema: Schema<I, O, M>, catchAll: Schema<J, P, N>) {
  type K = I & Record<string, InferType<typeof catchAll>>;
  return refineWithMetainformation(
    schema,
    (v, { options }: RefineContext<K>) => {
      const validation: { [key: string]: unknown } = {};
      for (const key of Object.keys(v)) {
        if (!Object.hasOwn(schema.meta().schema, key)) {
          validation[key] = catchAll.validate(v[key], options);
        }
      }
      if (Object.keys(validation).length === 0) {
        return;
      }
      return validation as Validation<K>;
    },
    { additionalProperties: catchAll }
  );
}

export function empty(): Schema<
  Record<string, never>,
  Record<string, never>,
  { type: "object" }
> {
  return object({});
}

export function fromInstance<T>(
  constructor: {
    new (...args: unknown[]): T;
  },
  issues?: Partial<{
    required: string;
    wrongType: string;
  }>
): Schema<T, T, { type: "object"; instance: string }> {
  return makeSimpleSchema(
    (v) => {
      if (typeof v === "undefined" || v === null) {
        return new ValidationIssue(
          "required",
          issues?.required,
          v
        ) as Validation<T>;
      }
      const isValid = v instanceof constructor;
      if (!isValid) {
        return new ValidationIssue(
          "wrong_type",
          issues?.wrongType,
          v,
          constructor
        ) as Validation<T>;
      }
    },
    () => ({ type: "object", instance: constructor.name })
  );
}

export function isInstance<I, O, M>(
  schema: Schema<I, O, M>,
  constructor: { new (...args: unknown[]): I },
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      const isValid = v instanceof constructor;
      if (!isValid) {
        return new ValidationIssue(
          "wrong_type",
          issue,
          v,
          constructor
        ) as Validation<I>;
      }
    },
    { instance: constructor.name }
  );
}

export function omit<
  I,
  O,
  M extends { schema: { [K in keyof I]: Schema<I[K], unknown, unknown> } },
  K extends keyof I
>(
  schema: Schema<I, O, M>,
  ...keys: K[]
): Schema<
  {
    [Key in keyof I as Key extends K ? never : Key]: I[Key];
  },
  {
    [Key in keyof O as Key extends K ? never : Key]: O[Key];
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

  const filterValidation = (validation: Validation<I>) => {
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
  };

  return makeSchema(
    (v, o) => {
      const validation = schema.validate(v, o);
      if (isFailure(validation)) {
        return filterValidation(validation);
      }
    },
    async (v, o) => {
      const validation = await schema.validateAsync(v, o);
      if (isFailure(validation)) {
        return filterValidation(validation);
      }
    },
    () => ({
      type: "object",
      schema: filteredSchemas as Omit<M["schema"], K>,
    })
  );
}

export function pick<
  I,
  O,
  M extends { schema: { [K in keyof I]: Schema<I[K], unknown, unknown> } },
  K extends keyof I
>(
  schema: Schema<I, O, M>,
  ...keys: K[]
): Schema<
  { [key in K]: I[key] },
  {
    [Key in keyof O as Key extends K ? Key : never]: O[Key];
  },
  { type: "object"; schema: { [key in K]: M["schema"][key] } }
> {
  const filteredSchemas = {};
  for (const [key, value] of Object.entries(schema.meta().schema)) {
    if (keys.includes(key as K)) {
      filteredSchemas[key] = value;
    }
  }

  const filterValidation = (validation: Validation<I>) => {
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
  };

  return makeSchema(
    (v, o) => {
      const validation = schema.validate(v, o);
      if (isFailure(validation)) {
        return filterValidation(validation);
      }
    },
    async (v, o) => {
      const validation = await schema.validateAsync(v, o);
      if (isFailure(validation)) {
        return filterValidation(validation);
      }
    },
    () => ({
      type: "object",
      schema: filteredSchemas as { [key in K]: M["schema"][key] },
    })
  );
}

export function keys<
  I,
  O,
  M extends { schema: { [K in keyof I]: Schema<unknown> } }
>(
  schema: Schema<I, O, M>
): Schema<keyof I, keyof I, { type: "literals"; literals: (keyof I)[] }> {
  return literals(...(Object.keys(schema.meta().schema) as (keyof I)[]));
}
