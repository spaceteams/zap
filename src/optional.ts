import { makeSchema, narrow, Schema } from "./schema";
import { ValidationResult } from "./validation";

export function optional<T>(schema: Schema<T>): Schema<T | undefined> {
  return makeSchema((v) => {
    if (typeof v !== "undefined") {
      return schema.validate(v);
    }
  });
}
export function nullable<T>(schema: Schema<T>): Schema<T | null> {
  return makeSchema((v) => {
    if (v !== null) {
      return schema.validate(v);
    }
  });
}
export function nullish<T>(schema: Schema<T>): Schema<T | undefined | null> {
  const s = makeSchema((v) => {
    if (typeof v !== "undefined" && v !== null) {
      return schema.validate(v);
    }
  });
  return s;
}

export function required<T>(schema: Schema<T | undefined | null>): Schema<T> {
  type V = ValidationResult<T>;
  return makeSchema((v) => {
    if (typeof v === "undefined" || v === null) {
      return "value should be present" as V;
    }
    return schema.validate(v) as V;
  });
}

export function defaultValue<T>(
  schema: Schema<T | undefined | null>,
  value: T
): Schema<T> {
  return narrow(schema, (v) => v ?? value);
}

export function nullToUndefined<T>(
  schema: Schema<T | undefined | null>
): Schema<T | undefined> {
  return narrow(schema, (v) => v ?? undefined);
}

export function undefinedSchema(): Schema<undefined> {
  return makeSchema((v) => {
    if (typeof v !== "undefined") {
      return "value should be undefined";
    }
  });
}
export function nullSchema(): Schema<null> {
  return makeSchema((v) => {
    if (typeof v !== null) {
      return "value should be null";
    }
  });
}
