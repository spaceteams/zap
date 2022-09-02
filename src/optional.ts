import { makeSchema, Schema } from "./schema";
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
