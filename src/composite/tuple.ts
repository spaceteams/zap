import { InferTypes, getOption, makeSchema, Schema } from "../schema";
import {
  isFailure,
  isSuccess,
  makeIssue,
  Validation,
  ValidationResult,
} from "../validation";

export function tuple<T extends readonly Schema<unknown, unknown>[]>(
  ...schemas: T
): Schema<InferTypes<T>, { type: "tuple"; schemas: T }> {
  return tupleWithIssues(schemas);
}

export function tupleWithIssues<T extends readonly Schema<unknown, unknown>[]>(
  schemas: T,
  issues?: Partial<{
    required: string;
    wrongType: string;
    length: string;
  }>
): Schema<InferTypes<T>, { type: "tuple"; schemas: T }> {
  type ResultT = InferTypes<T>;
  type V = Validation<ResultT>;
  return makeSchema(
    (v, o) => {
      if (typeof v === "undefined" || v === null) {
        return makeIssue("required", issues?.required, v) as V;
      }
      if (!Array.isArray(v)) {
        return makeIssue("wrong_type", issues?.wrongType, v, "array") as V;
      }
      if (schemas.length !== v.length) {
        return makeIssue("length", issues?.length, v, schemas.length) as V;
      }

      const validations = [] as ValidationResult<unknown>[];
      let i = 0;
      for (const value of v) {
        const validation = schemas[i].validate(value, o);
        validations.push(validation);
        if (getOption(o, "earlyExit") && isFailure(validation)) {
          return validations as V;
        }
        i++;
      }
      if (validations.every((v) => isSuccess(v))) {
        return;
      }
      return validations as V;
    },
    () => ({ type: "tuple", schemas }),
    (v, o) => {
      const result: unknown[] = [];
      let i = 0;
      for (const value of v) {
        result.push(schemas[i].parse(value, o));
        i++;
      }
      return result as ResultT;
    }
  );
}