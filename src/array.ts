import { makeSchema, refine, Schema } from "./schema";
import { isFailure, isSuccess, ValidationResult } from "./validation";

export function array<T>(schema: Schema<T>): Schema<T[]> {
  return makeSchema((v, o) => {
    if (!Array.isArray(v)) {
      return "value should be an array";
    }
    const validations: ValidationResult<T[]> = [];
    for (const value of v) {
      const validation = schema.validate(value, o);
      validations.push(validation);
      if (o?.earlyExit && isFailure(validation)) {
        return validations;
      }
    }
    if (validations.every((v) => isSuccess(v))) {
      return;
    }
    return validations;
  });
}
export function min<T>(schema: Schema<T[]>, minLength: number): Schema<T[]> {
  return refine(schema, (v) => {
    if (v.length < minLength) {
      return `value should contain at least ${minLength} items`;
    }
  });
}
export function max<T>(schema: Schema<T[]>, maxLength: number): Schema<T[]> {
  return refine(schema, (v) => {
    if (v.length > maxLength) {
      return `value should contain at most ${maxLength} items`;
    }
  });
}
export function length<T>(schema: Schema<T[]>, length: number): Schema<T[]> {
  return refine(schema, (v) => {
    if (v.length === length) {
      return `value should contain exactly ${length} items`;
    }
  });
}
export function includes<T>(
  schema: Schema<T[]>,
  element: T,
  fromIndex: number
): Schema<T[]> {
  return refine(schema, (v) => {
    if (!v.includes(element, fromIndex)) {
      return "value should contain given element";
    }
  });
}
export function nonEmpty<T>(schema: Schema<T[]>): Schema<T[]> {
  return min(schema, 1);
}
