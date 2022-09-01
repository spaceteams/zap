import { makeSchema, makeValidation, refine, Schema } from "./schema";

export function string(): Schema<string> {
  return makeSchema((v) =>
    makeValidation(typeof v === "string", "value should be a string")
  );
}
export function min(schema: Schema<string>, minLength: number): Schema<string> {
  return refine(schema, (v) =>
    makeValidation(
      v.length >= minLength,
      `value should have at least length ${minLength}`
    )
  );
}
export function max(schema: Schema<string>, maxLength: number): Schema<string> {
  return refine(schema, (v) =>
    makeValidation(
      v.length <= maxLength,
      `value should have at most length  ${maxLength}`
    )
  );
}
export function length(schema: Schema<string>, length: number): Schema<string> {
  return refine(schema, (v) =>
    makeValidation(v.length === length, `value should have length ${length}`)
  );
}
export function nonEmpty(schema: Schema<string>): Schema<string> {
  return min(schema, 1);
}
export function regex(schema: Schema<string>, regex: RegExp): Schema<string> {
  return refine(schema, (v) =>
    makeValidation(regex.test(v), "value should match expression")
  );
}
export function startsWith(
  schema: Schema<string>,
  searchString: string,
  position?: number
): Schema<string> {
  return refine(schema, (v) =>
    makeValidation(
      v.startsWith(searchString, position),
      `value should start with ${searchString}`
    )
  );
}
export function endsWith(
  schema: Schema<string>,
  searchString: string,
  position?: number
): Schema<string> {
  return refine(schema, (v) =>
    makeValidation(
      v.endsWith(searchString, position),
      `value should end with ${searchString}`
    )
  );
}
