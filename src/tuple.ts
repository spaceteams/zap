import { defaultOptions, InferTypes, makeSchema, Schema } from "./schema";
import {
  isFailure,
  isSuccess,
  Validation,
  ValidationResult,
} from "./validation";

export function tuple<T extends Schema<unknown>[]>(
  ...schemas: T
): Schema<InferTypes<T>> {
  type V = Validation<InferTypes<T>>;
  return makeSchema((v, o = defaultOptions) => {
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
      if (o?.earlyExit && isFailure(validation)) {
        return validations as V;
      }
      i++;
    }
    if (validations.every((v) => isSuccess(v))) {
      return;
    }
    return validations as V;
  });
}
