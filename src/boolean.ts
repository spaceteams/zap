import { makeSchema, Schema } from "./schema";

export function boolean(): Schema<boolean> {
  return makeSchema((v) => {
    if (typeof v !== "boolean") {
      return "value should be a boolean";
    }
  });
}
