import { InferTypes, getOption, makeSchema, Schema } from "./schema";
import {
  isFailure,
  isSuccess,
  makeError,
  Validation,
  ValidationResult,
} from "./validation";

export function tuple<T extends Schema<unknown, unknown>[]>(
  ...schemas: T
): Schema<InferTypes<T>, { type: "tuple"; schemas: T }> {
  type ResultT = InferTypes<T>;
  type V = Validation<ResultT>;
  return makeSchema(
    (v, o) => {
      if (!Array.isArray(v)) {
        return makeError("wrong_type", v, "array") as V;
      }
      if (schemas.length !== v.length) {
        return makeError("invalid_value", v, "length", schemas.length) as V;
      }

      const validations = [] as ValidationResult<unknown>[];
      let i = 0;
      for (const value of v) {
        const validation = schemas[i].validate(value, o);
        validations.push(validation);
        if (getOption(o, "earlyExit") && isFailure(validation)) {
          return validations as V;
        }
        i++;
      }
      if (validations.every((v) => isSuccess(v))) {
        return;
      }
      return validations as V;
    },
    () => ({ type: "tuple", schemas }),
    (v, o) => {
      const result: unknown[] = [];
      let i = 0;
      for (const value of v) {
        result.push(schemas[i].parse(value, o));
        i++;
      }
      return result as ResultT;
    }
  );
}
