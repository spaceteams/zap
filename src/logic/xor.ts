import { Unionize } from "../utility";
import { InferOutputTypes, InferTypes, ParseResult, Schema } from "../schema";
import { isSuccess, ValidationIssue, ValidationResult } from "../validation";

export function xor<T extends readonly Schema<unknown>[]>(
  ...schemas: T
): Schema<
  Unionize<InferTypes<T>>,
  Unionize<InferOutputTypes<T>>,
  { type: "xor"; schemas: T }
> {
  return xorWithIssue(schemas);
}

export function xorWithIssue<T extends readonly Schema<unknown>[]>(
  schemas: T,
  issue?: string
): Schema<
  Unionize<InferTypes<T>>,
  Unionize<InferOutputTypes<T>>,
  { type: "xor"; schemas: T }
> {
  type ResultI = Unionize<InferTypes<T>>;
  type ResultO = Unionize<InferOutputTypes<T>>;
  type V = ValidationResult<ResultI>;

  const validate: Schema<ResultI, ResultO, unknown>["validate"] = (v, o) => {
    let result: ValidationResult<unknown>;
    let hasSuccess = false;
    for (const schema of schemas) {
      result = schema.validate(v, o);
      if (isSuccess(result)) {
        if (hasSuccess) {
          return new ValidationIssue("xor", issue, v) as V;
        } else {
          hasSuccess = true;
        }
      }
    }
    if (!hasSuccess) {
      return result as V;
    }
  };
  const validateAsync: Schema<
    ResultI,
    ResultO,
    unknown
  >["validateAsync"] = async (v, o) => {
    let result: ValidationResult<unknown>;
    let hasSuccess = false;
    for (const schema of schemas) {
      result = await schema.validateAsync(v, o);
      if (isSuccess(result)) {
        if (hasSuccess) {
          return new ValidationIssue("xor", issue, v) as V;
        } else {
          hasSuccess = true;
        }
      }
    }
    if (!hasSuccess) {
      return result as V;
    }
  };
  const parse: Schema<ResultI, ResultO, unknown>["parse"] = (v, o) => {
    let validation: ValidationResult<unknown>;
    let successSchema: Schema<unknown> | undefined;
    for (const schema of schemas) {
      validation = schema.validate(v, o);
      if (isSuccess(validation)) {
        if (successSchema !== undefined) {
          return {
            validation: new ValidationIssue("xor", issue, v) as V,
          };
        }
        successSchema = schema;
        break;
      }
    }
    if (successSchema === undefined) {
      throw validation;
    }
    return successSchema.parse(v, {
      ...o,
      skipValidation: true,
    }) as ParseResult<ResultI, ResultO>;
  };
  const parseAsync: Schema<ResultI, ResultO, unknown>["parseAsync"] = async (
    v,
    o
  ) => {
    let validation: ValidationResult<unknown>;
    let successSchema: Schema<unknown> | undefined;
    for (const schema of schemas) {
      validation = await schema.validateAsync(v, o);
      if (isSuccess(validation)) {
        if (successSchema !== undefined) {
          return {
            validation: new ValidationIssue("xor", issue, v) as V,
          };
        }
        successSchema = schema;
        break;
      }
    }
    if (successSchema === undefined) {
      throw validation;
    }
    return successSchema.parse(v, {
      ...o,
      skipValidation: true,
    }) as ParseResult<ResultI, ResultO>;
  };

  return {
    accepts: (v, o): v is Unionize<InferTypes<T>> => isSuccess(validate(v, o)),
    parse,
    parseAsync,
    validate,
    validateAsync,
    meta: () => ({ type: "xor", schemas }),
  };
}
