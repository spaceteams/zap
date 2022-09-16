import { fromInstance } from "./object";
import { refineWithMetainformation, Schema } from "./schema";
import { makeError } from "./validation";

export function date(): Schema<Date, { type: "object"; instance: string }> {
  return fromInstance(Date);
}

export function before<M>(schema: Schema<Date, M>, value: Date) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v >= value) {
        return makeError("invalid_value", v, "before", value);
      }
    },
    { max: value }
  );
}
export function after<M>(schema: Schema<Date, M>, value: Date) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v <= value) {
        return makeError("invalid_value", v, "after", value);
      }
    },
    { min: value }
  );
}
