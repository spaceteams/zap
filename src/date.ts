import { fromInstance } from "./object";
import { refineWithMetainformation, Schema } from "./schema";

export function date(): Schema<Date, { type: "object"; instance: string }> {
  return fromInstance(Date, "value should be a date");
}

export function before<M>(schema: Schema<Date, M>, value: Date) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v >= value) {
        return `value should be before ${value.toISOString()}`;
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
        return `value should be after ${value.toISOString()}`;
      }
    },
    { min: value }
  );
}
