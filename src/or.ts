import { isSuccess, makeSchema, Schema } from "./schema";

export function or<S, T>(left: Schema<S>, right: Schema<T>): Schema<S | T> {
  return makeSchema((v) =>
    isSuccess(left.validate(v)) ? undefined : right.validate(v)
  );
}
