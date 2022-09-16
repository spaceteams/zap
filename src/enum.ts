import { makeSchema, Schema } from "./schema";

export type EnumLike = { [k: string]: string | number };

export function nativeEnum<T extends EnumLike>(
  e: T
): Schema<string | number, { type: "enum"; enum: T }> {
  const entries = new Set(
    Object.entries(e)
      .filter(([key]) => !Number.isInteger(Number(key)))
      .map(([_, value]) => value)
  );

  return makeSchema(
    (v) => {
      if (typeof v !== "string" && typeof v !== "number") {
        return "value should be string or number";
      }
      if (!entries.has(v)) {
        return "value should be a valid enum";
      }
    },
    () => ({ type: "enum", enum: e })
  );
}
