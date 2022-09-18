import { makeSchema, Schema } from "../schema";
import { makeIssue } from "../validation";

export function boolean(): Schema<boolean, { type: "boolean" }> {
  return makeSchema(
    (v) => {
      if (typeof v !== "boolean") {
        return makeIssue("wrong_type", v, "boolean");
      }
    },
    () => ({ type: "boolean" })
  );
}
