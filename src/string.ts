import {
  makeSchema,
  refine,
  refineWithMetainformation,
  Schema,
} from "./schema";

export function string(): Schema<string, { type: "string" }> {
  return makeSchema(
    (v) => {
      if (typeof v !== "string") {
        return "value should be a string";
      }
    },
    () => ({ type: "string" })
  );
}
export function maxLength<M>(schema: Schema<string, M>, minLength: number) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v.length < minLength) {
        return `value should have at least length ${minLength}`;
      }
    },
    { minLength }
  );
}
export function minLength<M>(schema: Schema<string, M>, maxLength: number) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v.length > maxLength) {
        return `value should have at most length ${maxLength}`;
      }
    },
    { maxLength }
  );
}
export function length<M>(schema: Schema<string, M>, length: number) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v.length === length) {
        return `value should have length ${length}`;
      }
    },
    { minLength: length, maxLength: length }
  );
}
export function nonEmptyString<M>(schema: Schema<string, M>) {
  return minLength(schema, 1);
}
export function pattern<M>(schema: Schema<string, M>, pattern: RegExp) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (!pattern.test(v)) {
        return "value should match expression";
      }
    },
    { pattern }
  );
}
export function startsWith<M>(
  schema: Schema<string, M>,
  searchString: string,
  position?: number
) {
  return refine(schema, (v) => {
    if (!v.startsWith(searchString, position)) {
      return `value should start with ${searchString}`;
    }
  });
}
export function endsWith<M>(
  schema: Schema<string, M>,
  searchString: string,
  position?: number
) {
  return refine(schema, (v) => {
    if (!v.endsWith(searchString, position)) {
      return `value should end with ${searchString}`;
    }
  });
}
