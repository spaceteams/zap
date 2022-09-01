import { makeSchema, Schema } from "./schema";

export function optional<T>(schema: Schema<T>): Schema<T | undefined> {
  return makeSchema((v) =>
    typeof v === "undefined" ? undefined : schema.validate(v)
  );
}
export function nullable<T>(schema: Schema<T>): Schema<T | null> {
  return makeSchema((v) => (v === null ? undefined : schema.validate(v)));
}
export function nullish<T>(schema: Schema<T>): Schema<T | undefined | null> {
  return makeSchema((v) =>
    typeof v === "undefined" || v === null ? undefined : schema.validate(v)
  );
}
