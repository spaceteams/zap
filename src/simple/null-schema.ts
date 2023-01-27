import { makeSimpleSchema, Schema } from "../schema";
import { ValidationIssue } from "../validation";

export function nullSchema(
  issue?: string
): Schema<null, null, { type: "null" }> {
  return makeSimpleSchema(
    (v) => {
      if (v !== null) {
        return new ValidationIssue("wrong_type", issue, v, "null");
      }
    },
    () => ({ type: "null" })
  );
}
