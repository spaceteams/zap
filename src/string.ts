import { makeSchema, refine, Schema } from "./schema";

export function string(): Schema<string> {
  return makeSchema((v) =>
    typeof v === "string" ? undefined : "value should be a string"
  );
}
export function min(schema: Schema<string>, minLength: number): Schema<string> {
  return refine(schema, (v) =>
    v.length >= minLength
      ? undefined
      : `value should have at least length ${minLength}`
  );
}
export function max(schema: Schema<string>, maxLength: number): Schema<string> {
  return refine(schema, (v) =>
    v.length <= maxLength
      ? undefined
      : `value should have at most length  ${maxLength}`
  );
}
export function length(schema: Schema<string>, length: number): Schema<string> {
  return refine(schema, (v) =>
    v.length === length ? undefined : `value should have length ${length}`
  );
}
export function nonEmpty(schema: Schema<string>): Schema<string> {
  return min(schema, 1);
}
export function regex(schema: Schema<string>, regex: RegExp): Schema<string> {
  return refine(schema, (v) =>
    regex.test(v) ? undefined : "value should match expression"
  );
}
export function startsWith(
  schema: Schema<string>,
  searchString: string,
  position?: number
): Schema<string> {
  return refine(schema, (v) =>
    v.startsWith(searchString, position)
      ? undefined
      : `value should start with ${searchString}`
  );
}
export function endsWith(
  schema: Schema<string>,
  searchString: string,
  position?: number
): Schema<string> {
  return refine(schema, (v) =>
    v.endsWith(searchString, position)
      ? undefined
      : `value should end with ${searchString}`
  );
}
