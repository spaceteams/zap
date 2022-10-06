import { makeSchema, Schema } from "../schema";
import { makeIssue } from "../validation";

export function boolean(
  issues?: Partial<{
    required: string;
    wrongType: string;
  }>
): Schema<boolean, boolean, { type: "boolean" }> {
  return makeSchema(
    (v) => {
      if (typeof v === "undefined" || v === null) {
        return makeIssue("required", issues?.required, v);
      }
      if (typeof v !== "boolean") {
        return makeIssue("wrong_type", issues?.wrongType, v, "boolean");
      }
    },
    () => ({ type: "boolean" })
  );
}
