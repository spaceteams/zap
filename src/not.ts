import { makeSchema, Schema } from "./schema";
import { isSuccess, makeError } from "./validation";

export function not<T, M>(
  schema: Schema<T, M>
): Schema<unknown, { type: "not"; schema: Schema<T, M> }> {
  return makeSchema(
    (v, o) => {
      if (isSuccess(schema.validate(v, o))) {
        return makeError("invalid_value", v, "not");
      }
    },
    () => ({
      type: "not",
      schema,
    })
  );
}
