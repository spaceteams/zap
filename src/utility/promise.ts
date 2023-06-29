import { makeSchema, makeSimpleSchema, Schema } from "../schema";
import { isFailure, ValidationIssue } from "../validation";

export function promise<T>(
  issues: Partial<{
    required: string;
    wrongType: string;
  }> = {}
): Schema<Promise<T>, Promise<T>, { type: "promise" }> {
  return makeSimpleSchema(
    (v) => {
      if (v === undefined || v === null) {
        return new ValidationIssue("required", issues?.required, v);
      }
      if (typeof v !== "object") {
        return new ValidationIssue(
          "wrong_type",
          issues?.wrongType,
          v,
          "object"
        );
      }
      if (!("then" in v)) {
        return new ValidationIssue(
          "wrong_type",
          issues?.wrongType,
          v,
          "thenable"
        );
      }
    },
    () => ({ type: "promise" })
  );
}

export function validatedPromise<T>(
  schema: Schema<T>,
  issues: Partial<{
    required: string;
    wrongType: string;
    invalidPromise: string;
  }> = {}
): Schema<Promise<T>, Promise<T>, { type: "promise"; schema: Schema<T> }> {
  const base = promise<T>(issues);
  return makeSchema(
    base.validate,
    base.validateAsync,
    () => ({ type: "promise", schema }),
    (v, o) =>
      v.then((v) => {
        const validation = schema.validate(v, o);
        if (isFailure(validation)) {
          throw new ValidationIssue(
            "invalid_promise",
            issues?.invalidPromise,
            v,
            validation
          );
        }
        return v;
      })
  );
}
