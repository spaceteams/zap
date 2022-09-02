import {
  InferTypes,
  isSuccess,
  makeSchema,
  Schema,
  Validation,
} from "./schema";

export function tuple<T extends Schema<unknown>[]>(
  ...schemas: T
): Schema<InferTypes<T>> {
  type V = Validation<InferTypes<T>>;
  return makeSchema((v) => {
    if (!Array.isArray(v)) {
      // FIXME: this cast should be unnecessary
      return "value should be an array" as V;
    }
    if (schemas.length !== v.length) {
      // FIXME: this cast should be unnecessary
      return `value should have length ${schemas.length}` as V;
    }
    const validations = v.map((value, i) => schemas[i].validate(value));
    if (validations.every((v) => isSuccess(v))) {
      return;
    }
    // FIXME: this cast should be unnecessary
    return validations as V;
  });
}
