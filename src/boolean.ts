import { makeSchema, makeValidation, Schema } from "./schema";

export function boolean(): Schema<boolean> {
  return makeSchema((v) =>
    makeValidation(typeof v === "boolean", "value should be a boolean")
  );
}
