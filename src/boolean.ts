import { makeSchema, Schema } from "./schema";

export function boolean(): Schema<boolean, { type: "boolean" }> {
  return makeSchema(
    (v) => {
      if (typeof v !== "boolean") {
        return "value should be a boolean";
      }
    },
    () => ({ type: "boolean" })
  );
}
