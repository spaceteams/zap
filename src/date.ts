import { fromInstance } from "./object";
import { coerce, refine, refineWithMetainformation, Schema } from "./schema";
import { makeError } from "./validation";

export function date(): Schema<Date, { type: "object"; instance: string }> {
  return refine(fromInstance(Date), (d) => {
    if (Number.isNaN(d)) {
      return makeError("invalid_value", d, "isNaN");
    }
  });
}

export function coercedDate(): Schema<
  Date,
  { type: "object"; instance: string }
> {
  return coerce(date(), (v) => {
    if (typeof v === "string" || typeof v === "number") {
      return new Date(v);
    }
    return v;
  });
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
