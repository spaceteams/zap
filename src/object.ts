import { isFailure, makeSchema, Schema, Validation } from "./schema";

export function object<T>(schema: { [K in keyof T]: Schema<T[K]> }): Schema<T> {
  return makeSchema((v) => {
    if (typeof v !== "object") {
      // FIXME: this cast should be unnecessary
      return "value should be an object" as Validation<T>;
    }
    if (v === null) {
      // FIXME: this cast should be unnecessary
      return "value should not be null" as Validation<T>;
    }
    const validation: { [key: string]: unknown } = {};
    for (const [key, inner] of Object.entries(schema)) {
      const innerValidation = (inner as Schema<unknown>).validate(
        (v as { [k: string]: unknown })[key]
      );
      if (isFailure(innerValidation)) {
        validation[key] = innerValidation;
      }
    }
    if (Object.keys(validation).length === 0) {
      return;
    }
    // FIXME: this cast should be unnecessary
    return validation as Validation<T>;
  });
}

export function omit<T, K extends keyof T>(
  schema: Schema<T>,
  ...keys: K[]
): Schema<Omit<T, K>> {
  return makeSchema((v) => {
    const validation = schema.validate(v);
    if (validation === undefined) {
      return validation;
    }

    const filteredValidation: { [key: string]: unknown } = {};
    for (const [key, value] of Object.entries(validation)) {
      if (!keys.includes(key as K)) {
        filteredValidation[key] = value;
      }
    }
    if (Object.keys(filteredValidation as object).length === 0) {
      return;
    }
    return validation;
  });
}

export function pick<T, K extends keyof T>(
  schema: Schema<T>,
  ...keys: K[]
): Schema<Pick<T, K>> {
  return makeSchema((v) => {
    const validation = schema.validate(v);
    if (validation === undefined) {
      return validation;
    }

    const filteredValidation: { [key: string]: unknown } = {};
    for (const [key, value] of Object.entries(validation)) {
      if (keys.includes(key as K)) {
        filteredValidation[key] = value;
      }
    }
    if (Object.keys(filteredValidation as object).length === 0) {
      return;
    }
    return validation;
  });
}

export function at<T, K extends keyof T>(
  schema: Schema<T>,
  key: K
): Schema<T[K]> {
  return makeSchema((v) => {
    const validation = schema.validate({ [key]: v });
    if (validation === undefined) {
      return;
    }
    return validation[key as keyof Validation<T>] as Validation<T[K]>;
  });
}
