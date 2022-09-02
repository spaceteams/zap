import { makeSchema, refine, Schema } from "./schema";

export function string(): Schema<string> {
  return makeSchema((v) => {
    if (typeof v !== "string") {
      return "value should be a string";
    }
  });
}
export function min(schema: Schema<string>, minLength: number): Schema<string> {
  return refine(schema, (v) => {
    if (v.length < minLength) {
      return `value should have at least length ${minLength}`;
    }
  });
}
export function max(schema: Schema<string>, maxLength: number): Schema<string> {
  return refine(schema, (v) => {
    if (v.length > maxLength) {
      return `value should have at most length ${maxLength}`;
    }
  });
}
export function length(schema: Schema<string>, length: number): Schema<string> {
  return refine(schema, (v) => {
    if (v.length === length) {
      return `value should have length ${length}`;
    }
  });
}
export function nonEmpty(schema: Schema<string>): Schema<string> {
  return min(schema, 1);
}
export function regex(schema: Schema<string>, regex: RegExp): Schema<string> {
  return refine(schema, (v) => {
    if (!regex.test(v)) {
      return "value should match expression";
    }
  });
}
export function startsWith(
  schema: Schema<string>,
  searchString: string,
  position?: number
): Schema<string> {
  return refine(schema, (v) => {
    if (!v.startsWith(searchString, position)) {
      return `value should start with ${searchString}`;
    }
  });
}
export function endsWith(
  schema: Schema<string>,
  searchString: string,
  position?: number
): Schema<string> {
  return refine(schema, (v) => {
    if (!v.endsWith(searchString, position)) {
      return `value should end with ${searchString}`;
    }
  });
}
