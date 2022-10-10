import { InferOutputTypes, InferTypes, ParseResult, Schema } from "../schema";
import { isSuccess, ValidationResult } from "../validation";
import { Unionize } from "../utility";

export function or<T extends Schema<unknown, unknown, unknown>[]>(
  ...schemas: T
): Schema<
  Unionize<InferTypes<T>>,
  Unionize<InferOutputTypes<T>>,
  { type: "or"; schemas: T }
> {
  type ResultI = Unionize<InferTypes<T>>;
  type ResultO = Unionize<InferOutputTypes<T>>;
  type V = ValidationResult<ResultI>;
  const validate: Schema<ResultI, ResultO, unknown>["validate"] = (v, o) => {
    let result: ValidationResult<unknown>;
    for (const schema of schemas) {
      result = schema.validate(v, o);
      if (isSuccess(result)) {
        return;
      }
    }
    return result as V;
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
    meta: () => ({ type: "or", schemas }),
  };
}
