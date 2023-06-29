import { InferOutputTypes, InferTypes, ParseResult, Schema } from "../schema";
import { Unionize } from "../utility";
import {
  ValidationIssue,
  ValidationResult,
  isFailure,
  isSuccess,
} from "../validation";

export function discriminatedUnion<
  D extends string,
  T extends readonly Schema<
    unknown,
    unknown,
    {
      type: "object";
      schema: { [key in D]: Schema<unknown> };
    }
  >[]
>(
  discrimateKey: D,
  ...schemas: T
): Schema<
  Unionize<InferTypes<T>>,
  Unionize<InferOutputTypes<T>>,
  { type: "or"; discrimateKey: D; schemas: T }
> {
  return discriminatedUnionWithIssues(discrimateKey, schemas);
}

export function discriminatedUnionWithIssues<
  D extends string,
  T extends readonly Schema<
    unknown,
    unknown,
    {
      type: "object";
      schema: { [key in D]: Schema<unknown> };
    }
  >[]
>(
  discrimateKey: D,
  schemas: T,
  issues?: Partial<{
    required: string;
    wrongType: string;
    unknownDiscrimate: string;
  }>
): Schema<
  Unionize<InferTypes<T>>,
  Unionize<InferOutputTypes<T>>,
  { type: "or"; discrimateKey: D; schemas: T }
> {
  type ResultI = Unionize<InferTypes<T>>;
  type ResultO = Unionize<InferOutputTypes<T>>;

  const findSchema = (v: { [k: string]: unknown }) => {
    for (const schema of schemas) {
      const discrimiator = schema.meta().schema[discrimateKey];
      if (discrimiator.accepts(v[discrimateKey])) {
        return schema;
      }
    }
  };

  const unknownDiscrimate = (v: unknown) =>
    new ValidationIssue(
      "unknownDiscrimate",
      issues?.unknownDiscrimate,
      v,
      discrimateKey
    ) as ValidationResult<ResultI>;

  const preValidate = (v: unknown) => {
    if (v === undefined || v === null) {
      return new ValidationIssue("required", issues?.required, v) as ResultI;
    }
    if (typeof v !== "object") {
      return new ValidationIssue(
        "wrong_type",
        issues?.wrongType,
        v,
        "object"
      ) as ResultI;
    }
  };

  const validate: Schema<ResultI, ResultO, unknown>["validate"] = (v, o) => {
    const validation = preValidate(v) as ValidationResult<ResultI>;
    if (isFailure(validation)) {
      return validation;
    }
    const schema = findSchema(v as { [k: string]: unknown });
    return schema
      ? (schema.validate(v, o) as ValidationResult<ResultI>)
      : unknownDiscrimate(v);
  };
  const validateAsync: Schema<
    ResultI,
    ResultO,
    unknown
  >["validateAsync"] = async (v, o) => {
    const validation = preValidate(v) as ValidationResult<ResultI>;
    if (isFailure(validation)) {
      return validation;
    }
    const schema = findSchema(v as { [k: string]: unknown });
    return schema
      ? (schema.validateAsync(v, o) as Promise<ValidationResult<ResultI>>)
      : unknownDiscrimate(v);
  };
  const parse: Schema<ResultI, ResultO, unknown>["parse"] = (v, o) => {
    const validation = preValidate(v) as ValidationResult<ResultI>;
    if (isFailure(validation)) {
      return { validation } as ParseResult<ResultI, ResultO>;
    }
    const schema = findSchema(v as { [k: string]: unknown });
    return schema
      ? (schema.parse(v, o) as ParseResult<ResultI, ResultO>)
      : { validation: unknownDiscrimate(v) };
  };
  const parseAsync: Schema<ResultI, ResultO, unknown>["parseAsync"] = async (
    v,
    o
  ) => {
    const validation = preValidate(v) as ValidationResult<ResultI>;
    if (isFailure(validation)) {
      return { validation } as ParseResult<ResultI, ResultO>;
    }
    const schema = findSchema(v as { [k: string]: unknown });
    return schema
      ? (schema.parseAsync(v, o) as Promise<ParseResult<ResultI, ResultO>>)
      : { validation: unknownDiscrimate(v) };
  };

  return {
    accepts: (v, o): v is Unionize<InferTypes<T>> => isSuccess(validate(v, o)),
    parse,
    parseAsync,
    validate,
    validateAsync,
    meta: () => ({ type: "or", schemas, discrimateKey }),
  };
}
