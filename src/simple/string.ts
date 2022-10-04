import {
  makeSchema,
  refine,
  refineWithMetainformation,
  Schema,
} from "../schema";
import { makeIssue } from "../validation";

export function string(
  issues?: Partial<{
    required: string;
    wrongType: string;
  }>
): Schema<string, { type: "string" }> {
  return makeSchema(
    (v) => {
      if (typeof v === "undefined" || v === null) {
        return makeIssue("required", issues?.required, v);
      }
      if (typeof v !== "string") {
        return makeIssue("wrong_type", issues?.wrongType, v, "string");
      }
    },
    () => ({ type: "string" })
  );
}
export function minLength<M>(
  schema: Schema<string, M>,
  minLength: number,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v.length < minLength) {
        return makeIssue("minLength", issue, v, minLength);
      }
    },
    { minLength }
  );
}
export function maxLength<M>(
  schema: Schema<string, M>,
  maxLength: number,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v.length > maxLength) {
        return makeIssue("maxLength", issue, v, maxLength);
      }
    },
    { maxLength }
  );
}
export function length<M>(
  schema: Schema<string, M>,
  length: number,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v.length === length) {
        return makeIssue("length", issue, v, length);
      }
    },
    { minLength: length, maxLength: length }
  );
}
export function nonEmptyString<M>(schema: Schema<string, M>, issue?: string) {
  return minLength(schema, 1, issue);
}
export function pattern<M>(
  schema: Schema<string, M>,
  pattern: RegExp,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (!pattern.test(v)) {
        return makeIssue("pattern", issue, v, pattern);
      }
    },
    { pattern }
  );
}
export function startsWith<M>(
  schema: Schema<string, M>,
  searchString: string,
  position?: number,
  issue?: string
) {
  return refine(schema, (v) => {
    if (!v.startsWith(searchString, position)) {
      return makeIssue("startsWith", issue, v, searchString, position);
    }
  });
}
export function endsWith<M>(
  schema: Schema<string, M>,
  searchString: string,
  position?: number,
  issue?: string
) {
  return refine(schema, (v) => {
    if (!v.endsWith(searchString, position)) {
      return makeIssue("endsWith", issue, v, searchString, position);
    }
  });
}
