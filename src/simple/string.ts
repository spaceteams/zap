import {
  makeSchema,
  refine,
  refineWithMetainformation,
  Schema,
} from "../schema";
import { makeIssue } from "../validation";

export function string(): Schema<string, { type: "string" }> {
  return makeSchema(
    (v) => {
      if (typeof v !== "string") {
        return makeIssue("wrong_type", v, "string");
      }
    },
    () => ({ type: "string" })
  );
}
export function minLength<M>(schema: Schema<string, M>, minLength: number) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v.length < minLength) {
        return makeIssue("minLength", v, minLength);
      }
    },
    { minLength }
  );
}
export function maxLength<M>(schema: Schema<string, M>, maxLength: number) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v.length > maxLength) {
        return makeIssue("maxLength", v, maxLength);
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
        return makeIssue("length", v, length);
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
        return makeIssue("pattern", v, pattern);
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
      return makeIssue("startsWith", v, searchString, position);
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
      return makeIssue("endsWith", v, searchString, position);
    }
  });
}
