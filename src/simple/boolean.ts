import { coerce, makeSchema, Schema } from "../schema";
import { ValidationIssue } from "../validation";

export function boolean(
  issues?: Partial<{
    required: string;
    wrongType: string;
  }>
): Schema<boolean, boolean, { type: "boolean" }> {
  return makeSchema(
    (v) => {
      if (typeof v === "undefined" || v === null) {
        return new ValidationIssue("required", issues?.required, v);
      }
      if (typeof v !== "boolean") {
        return new ValidationIssue(
          "wrong_type",
          issues?.wrongType,
          v,
          "boolean"
        );
      }
    },
    () => ({ type: "boolean" })
  );
}

export function coercedBoolean() {
  return coerce(boolean(), Boolean);
}
