import { isFailure, makeSchema, Schema, Validation } from "./schema";

export function record<T>(schema: Schema<T>): Schema<{ [key: string]: T }> {
  return makeSchema((v) => {
    if (typeof v !== "object") {
      return "value should be an object";
    }
    if (v === null) {
      return "value should not be null";
    }
    const validation: { [key: string]: unknown } = {};
    for (const [key, value] of Object.entries(v)) {
      const innerValidation = schema.validate(value);
      if (isFailure(innerValidation)) {
        validation[key] = innerValidation;
      }
    }
    if (Object.keys(validation).length === 0) {
      return;
    }
    return validation as Validation<{ [key: string]: T }>;
  });
}
