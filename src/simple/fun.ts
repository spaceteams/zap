import { makeSchema, refineWithMetainformation, Schema } from "../schema";
import { makeIssue } from "../validation";

export type Procedure<Args extends unknown[], Result> = (
  ...args: Args
) => Result;

export function fun<Args extends unknown[], Result>(
  issues?: Partial<{
    required: string;
    wrongType: string;
  }>
): Schema<
  Procedure<Args, Result>,
  Procedure<Args, Result>,
  { type: "function" }
> {
  return makeSchema(
    (v) => {
      if (typeof v === "undefined" || v === null) {
        return makeIssue("required", issues?.required, v);
      }
      if (typeof v !== "function") {
        return makeIssue("wrong_type", issues?.wrongType, v, "function");
      }
    },
    () => ({ type: "function" })
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
        return makeIssue("arity", issue, v, arity);
      }
    },
    { arity }
  );
}
