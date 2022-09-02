import { makeSchema, makeValidation, Schema, transform } from "./schema";

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
  const s = makeSchema((v) =>
    makeValidation(typeof v === "undefined" || v === null, () =>
      schema.validate(v)
    )
  );
  return s;
}

export function defaultValue<T>(
  schema: Schema<T | undefined>,
  value: T
): Schema<T | undefined, T> {
  return transform(schema, (v) => (v === undefined ? value : v));
}
