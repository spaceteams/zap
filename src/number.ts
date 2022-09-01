import { makeSchema, refine, Schema, validate } from "./schema";

export function number(): Schema<number> {
  return makeSchema((v) =>
    validate(
      typeof v === "number",
      "value should be a number",
      validate(!Number.isNaN(v), "value should not be NaN")
    )
  );
}
export function nan(): Schema<number> {
  return makeSchema((v) =>
    Number.isNaN(v) ? undefined : "value should be NaN"
  );
}
export function positive(schema: Schema<number>): Schema<number> {
  return refine(schema, (v) =>
    v > 0 ? undefined : "value should be positive"
  );
}
export function negative(schema: Schema<number>): Schema<number> {
  return refine(schema, (v) =>
    v < 0 ? undefined : "value should be negative"
  );
}
