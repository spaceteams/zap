import {
  coerce,
  makeSyncSchema,
  refine,
  refineWithMetainformation,
  Schema,
} from "../schema";
import { ValidationIssue } from "../validation";

export function string(
  issues?: Partial<{
    required: string;
    wrongType: string;
  }>
): Schema<string, string, { type: "string" }> {
  return makeSyncSchema(
    (v) => {
      if (typeof v === "undefined" || v === null) {
        return new ValidationIssue("required", issues?.required, v);
      }
      if (typeof v !== "string") {
        return new ValidationIssue(
          "wrong_type",
          issues?.wrongType,
          v,
          "string"
        );
      }
    },
    () => ({ type: "string" })
  );
}

export function coercedString() {
  return coerce(string(), String);
}

export function minLength<O, M>(
  schema: Schema<string, O, M>,
  minLength: number,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v.length < minLength) {
        return new ValidationIssue("minLength", issue, v, minLength);
      }
    },
    { minLength }
  );
}
export function maxLength<O, M>(
  schema: Schema<string, O, M>,
  maxLength: number,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v.length > maxLength) {
        return new ValidationIssue("maxLength", issue, v, maxLength);
      }
    },
    { maxLength }
  );
}
export function length<O, M>(
  schema: Schema<string, O, M>,
  length: number,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v.length === length) {
        return new ValidationIssue("length", issue, v, length);
      }
    },
    { minLength: length, maxLength: length }
  );
}
export function nonEmptyString<O, M>(
  schema: Schema<string, O, M>,
  issue?: string
) {
  return minLength(schema, 1, issue);
}
export function pattern<O, M>(
  schema: Schema<string, O, M>,
  pattern: RegExp,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (!pattern.test(v)) {
        return new ValidationIssue("pattern", issue, v, pattern);
      }
    },
    { pattern }
  );
}
export function startsWith<O, M>(
  schema: Schema<string, O, M>,
  searchString: string,
  position?: number,
  issue?: string
) {
  return refine(schema, (v) => {
    if (!v.startsWith(searchString, position)) {
      return new ValidationIssue(
        "startsWith",
        issue,
        v,
        searchString,
        position
      );
    }
  });
}
export function endsWith<O, M>(
  schema: Schema<string, O, M>,
  searchString: string,
  position?: number,
  issue?: string
) {
  return refine(schema, (v) => {
    if (!v.endsWith(searchString, position)) {
      return new ValidationIssue("endsWith", issue, v, searchString, position);
    }
  });
}
