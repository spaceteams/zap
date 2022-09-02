import { makeSchema, Schema } from "./schema";
import { isSuccess, makeValidation } from "./validation";

export function or<S, T>(left: Schema<S>, right: Schema<T>): Schema<S | T> {
  return makeSchema((v) =>
    makeValidation(isSuccess(left.validate(v)), () => right.validate(v))
  );
}
