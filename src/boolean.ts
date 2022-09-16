import { makeSchema, Schema } from "./schema";
import { makeError } from "./validation";

export function boolean(): Schema<boolean, { type: "boolean" }> {
  return makeSchema(
    (v) => {
      if (typeof v !== "boolean") {
        return makeError("wrong_type", v, "boolean");
      }
    },
    () => ({ type: "boolean" })
  );
}
