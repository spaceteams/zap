import { makeSchema, Schema } from "./schema";
import { makeError } from "./validation";

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
        return makeError("wrong_type", v, "string", "number");
      }
      if (!entries.has(v)) {
        return makeError("invalid_value", v, "enum", ...entries.values());
      }
    },
    () => ({ type: "enum", enum: e })
  );
}
