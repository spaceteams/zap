import { makeSchema, Schema } from "./schema";
import { isFailure } from "./validation";

export function or<S, T, M, N>(
  left: Schema<S, M>,
  right: Schema<T, N>
): Schema<S | T, { type: "or"; schemas: [Schema<S, M>, Schema<T, N>] }> {
  return makeSchema(
    (v) => {
      if (isFailure(left.validate(v))) {
        return right.validate(v);
      }
    },
    () => ({ type: "or", schemas: [left, right] })
  );
}
