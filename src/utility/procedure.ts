import { refineWithMetainformation } from "../refine";
import { makeSchema, makeSimpleSchema, Schema } from "../schema";
import { isFailure, ValidationIssue } from "../validation";

export type Procedure<Args extends unknown[], Result> = (
  ...args: Args
) => Result;

export function procedure<Args extends unknown[], Result>(
  issues: Partial<{
    required: string;
    wrongType: string;
  }> = {}
): Schema<
  Procedure<Args, Result>,
  Procedure<Args, Result>,
  { type: "function" }
> {
  return makeSimpleSchema(
    (v) => {
      if (typeof v === "undefined" || v === null) {
        return new ValidationIssue("required", issues?.required, v);
      }
      if (typeof v !== "function") {
        return new ValidationIssue(
          "wrong_type",
          issues?.wrongType,
          v,
          "function"
        );
      }
    },
    () => ({ type: "function" })
  );
}

export function validatedProcedure<Args extends unknown[], Result>(
  args: Schema<Args>,
  result: Schema<Result>,
  issues: Partial<{
    required: string;
    wrongType: string;
    invalidArguments: string;
    invalidReturn: string;
  }> = {}
): Schema<
  Procedure<Args, Result>,
  Procedure<Args, Result>,
  { type: "function"; schema: { args: Schema<Args>; result: Schema<Result> } }
> {
  const base = procedure<Args, Result>(issues);
  return makeSchema(
    base.validate,
    base.validateAsync,
    () => ({ type: "function", schema: { args, result } }),
    (v, o) =>
      (...a: Args) => {
        const argumentValidation = args.validate(a, o);
        if (isFailure(argumentValidation)) {
          throw new ValidationIssue(
            "invalid_arguments",
            issues?.invalidArguments,
            v,
            argumentValidation
          );
        }
        const r = v(...a);
        const resultValidation = result.validate(r, o);
        if (isFailure(resultValidation)) {
          throw new ValidationIssue(
            "invalid_return",
            issues?.invalidReturn,
            v,
            resultValidation
          );
        }
        return r;
      }
  );
}

export function arity<Args extends unknown[], O, M, Result>(
  schema: Schema<Procedure<Args, Result>, O, M>,
  arity: number,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v.length !== arity) {
        return new ValidationIssue("arity", issue, v, arity);
      }
    },
    { arity }
  );
}
