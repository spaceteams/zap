import { coerce, makeSimpleSchema, Schema } from "../schema";
import { ValidationIssue } from "../validation";

export function bigInt(
  issues?: Partial<{
    required: string;
    wrongType: string;
  }>
): Schema<bigint, bigint, { type: "bigint" }> {
  return makeSimpleSchema(
    (v) => {
      if (v === undefined || v === null) {
        return new ValidationIssue("required", issues?.required, v);
      }
      if (typeof v !== "bigint") {
        return new ValidationIssue(
          "wrong_type",
          issues?.wrongType,
          v,
          "bigint"
        );
      }
    },
    () => ({ type: "bigint" })
  );
}

export function coercedBigInt(
  issues?: Partial<{
    required: string;
    wrongType: string;
  }>
) {
  return coerce(bigInt(issues), (v) => {
    if (
      typeof v === "string" ||
      typeof v === "boolean" ||
      typeof v === "number"
    ) {
      try {
        return BigInt(v);
      } catch {
        return v;
      }
    }
    return v;
  });
}
