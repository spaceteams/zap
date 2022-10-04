import { makeSchema, Schema } from "../schema";
import { makeIssue } from "../validation";

export type EnumLike = { [k: string]: string | number };

export function nativeEnum<T extends EnumLike>(
  e: T,
  issues?: Partial<{
    required: string;
    wrongType: string;
    enum: string;
  }>
): Schema<string | number, { type: "enum"; enum: T }> {
  const entries = new Set(
    Object.entries(e)
      .filter(([key]) => !Number.isInteger(Number(key)))
      .map(([_, value]) => value)
  );

  return makeSchema(
    (v) => {
      if (typeof v === "undefined" || v === null) {
        return makeIssue("required", issues?.required, v);
      }
      if (typeof v !== "string" && typeof v !== "number") {
        return makeIssue(
          "wrong_type",
          issues?.wrongType,
          v,
          "string",
          "number"
        );
      }
      if (!entries.has(v)) {
        return makeIssue("enum", issues?.enum, v, ...entries.values());
      }
    },
    () => ({ type: "enum", enum: e })
  );
}
