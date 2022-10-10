import { Unionize } from "../utility";
import { InferOutputTypes, InferTypes, ParseResult, Schema } from "../schema";
import { isSuccess, makeIssue, ValidationResult } from "../validation";

export function xor<T extends readonly Schema<unknown, unknown, unknown>[]>(
  ...schemas: T
): Schema<
  Unionize<InferTypes<T>>,
  Unionize<InferOutputTypes<T>>,
  { type: "xor"; schemas: T }
> {
  return xorWithIssue(schemas);
}

export function xorWithIssue<
  T extends readonly Schema<unknown, unknown, unknown>[]
>(
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
          return makeIssue("xor", issue, v) as V;
        } else {
          hasSuccess = true;
        }
      }
    }
    if (!hasSuccess) {
      return result as V;
    }
  };

  return {
    accepts: (v, o): v is Unionize<InferTypes<T>> => isSuccess(validate(v, o)),
    validate,
    parse: (v, o) => {
      let validation: ValidationResult<unknown>;
      let successSchema: Schema<unknown, unknown, unknown> | undefined;
      for (const schema of schemas) {
        validation = schema.validate(v, o);
        if (isSuccess(validation)) {
          if (successSchema !== undefined) {
            throw makeIssue("xor", issue, v) as V;
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
    },
    meta: () => ({ type: "xor", schemas }),
  };
}
