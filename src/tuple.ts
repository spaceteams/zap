import { InferTypes, getOption, makeSchema, Schema } from "./schema";
import {
  isFailure,
  isSuccess,
  Validation,
  ValidationResult,
} from "./validation";

export function tuple<T extends Schema<unknown, unknown>[]>(
  ...schemas: T
): Schema<InferTypes<T>, { type: "tuple"; schemas: T }> {
  type V = Validation<InferTypes<T>>;
  return makeSchema(
    (v, o) => {
      if (!Array.isArray(v)) {
        return "value should be an array" as V;
      }
      if (schemas.length !== v.length) {
        return `value should have length ${schemas.length}` as V;
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
    () => ({ type: "tuple", schemas })
  );
}
