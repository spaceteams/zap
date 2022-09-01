import { isSuccess, makeSchema, makeValidation, Schema } from "./schema";

export function or<S, T>(left: Schema<S>, right: Schema<T>): Schema<S | T> {
  return makeSchema((v) =>
    makeValidation(isSuccess(left.validate(v)), () => right.validate(v))
  );
}
