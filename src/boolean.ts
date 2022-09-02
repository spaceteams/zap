import { makeSchema, Schema } from "./schema";
import { makeValidation } from "./validation";

export function boolean(): Schema<boolean> {
  return makeSchema((v) =>
    makeValidation(typeof v === "boolean", "value should be a boolean")
  );
}
