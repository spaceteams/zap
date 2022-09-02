import { fromInstance } from "./object";
import { makeValidation, refine, Schema } from "./schema";

export function date(): Schema<Date> {
  return fromInstance(Date, "value should be a date");
}

export function before(schema: Schema<Date>, value: Date): Schema<Date> {
  return refine(schema, (v) =>
    makeValidation(v < value, `value should be before ${value.toISOString()}`)
  );
}
export function after(schema: Schema<Date>, value: Date): Schema<Date> {
  return refine(schema, (v) =>
    makeValidation(v > value, `value should be after ${value.toISOString()}`)
  );
}
