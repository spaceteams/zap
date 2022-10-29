import { makeSyncSchema, Schema } from "../schema";
import { ValidationIssue, Validation } from "../validation";

export type EnumLike<E> = Record<keyof E, number | string>;

export function nativeEnum<T extends EnumLike<T>>(
  e: T,
  issues?: Partial<{
    required: string;
    wrongType: string;
    enum: string;
  }>
): Schema<T[keyof T], T[keyof T], { type: "enum"; enum: T }> {
  type V = Validation<T[keyof T]>;

  const entries = new Set(
    Object.entries(e)
      .filter(([key]) => !Number.isInteger(Number(key)))
      .map(([_, value]) => value)
  );

  return makeSyncSchema(
    (v) => {
      if (typeof v === "undefined" || v === null) {
        return new ValidationIssue("required", issues?.required, v) as V;
      }
      if (typeof v !== "string" && typeof v !== "number") {
        return new ValidationIssue(
          "wrong_type",
          issues?.wrongType,
          v,
          "string",
          "number"
        ) as V;
      }
      if (!entries.has(v)) {
        return new ValidationIssue(
          "enum",
          issues?.enum,
          v,
          ...entries.values()
        ) as V;
      }
    },
    () => ({ type: "enum", enum: e })
  );
}
