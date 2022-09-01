import { makeSchema, refine, Schema } from "./schema";

export function number(): Schema<number> {
  return makeSchema((v) =>
    typeof v === "number" ? undefined : "value should be a number"
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
