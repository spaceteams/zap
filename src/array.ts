import {
  isSuccess,
  makeSchema,
  makeValidation,
  refine,
  Schema,
  Validation,
} from "./schema";

export function array<T>(schema: Schema<T>): Schema<T[]> {
  return makeSchema((v) => {
    if (!Array.isArray(v)) {
      return "value should be an array" as Validation<T[]>;
    }
    const validations = v.map((value) => schema.validate(value));
    if (validations.every((v) => isSuccess(v))) {
      return;
    }
    return validations as Validation<T[]>;
  });
}
export function min<T>(schema: Schema<T[]>, minLength: number): Schema<T[]> {
  return refine(schema, (v) =>
    makeValidation(
      v.length >= minLength,
      `value should contain at least ${minLength} items`
    )
  );
}
export function max<T>(schema: Schema<T[]>, maxLength: number): Schema<T[]> {
  return refine(schema, (v) =>
    makeValidation(
      v.length <= maxLength,
      `value should contain at most ${maxLength} items`
    )
  );
}
export function length<T>(schema: Schema<T[]>, length: number): Schema<T[]> {
  return refine(schema, (v) =>
    makeValidation(
      v.length === length,
      `value should contain exactly ${length} items`
    )
  );
}
export function nonEmpty<T>(schema: Schema<T[]>): Schema<T[]> {
  return min(schema, 1);
}
