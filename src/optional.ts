import { makeSchema, makeValidation, Schema } from "./schema";

export function optional<T>(schema: Schema<T>): Schema<T | undefined> {
  return makeSchema((v) =>
    makeValidation(typeof v === "undefined", () => schema.validate(v))
  );
}
export function nullable<T>(schema: Schema<T>): Schema<T | null> {
  return makeSchema((v) =>
    makeValidation(v === null, () => schema.validate(v))
  );
}
export function nullish<T>(schema: Schema<T>): Schema<T | undefined | null> {
  return makeSchema((v) =>
    makeValidation(typeof v === "undefined", () => schema.validate(v))
  );
}
