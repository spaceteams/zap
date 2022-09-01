import { makeSchema, Schema } from "./schema";

export function boolean(): Schema<boolean> {
  return makeSchema((v) =>
    typeof v === "boolean" ? undefined : "value should be a boolean"
  );
}
