import { makeSchema, Schema } from "./schema";
import { isFailure } from "./validation";

export function or<S, T>(left: Schema<S>, right: Schema<T>): Schema<S | T> {
  return makeSchema((v) => {
    if (isFailure(left.validate(v))) {
      return right.validate(v);
    }
  });
}
