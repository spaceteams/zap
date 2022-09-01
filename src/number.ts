import { makeSchema, refine, Schema, makeValidation } from "./schema";

export function number(): Schema<number> {
  return makeSchema((v) =>
    makeValidation(typeof v === "number", "value should be a number", () =>
      makeValidation(!Number.isNaN(v), "value should not be NaN")
    )
  );
}
export function nan(): Schema<number> {
  return makeSchema((v) =>
    makeValidation(Number.isNaN(v), "value should be NaN")
  );
}
export function positive(schema: Schema<number>): Schema<number> {
  return refine(schema, (v) =>
    makeValidation(v > 0, "value should be positive")
  );
}
export function negative(schema: Schema<number>): Schema<number> {
  return refine(schema, (v) =>
    makeValidation(v < 0, "value should be negative")
  );
}
