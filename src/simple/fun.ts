import { makeSchema, refineWithMetainformation, Schema } from "../schema";
import { makeIssue } from "../validation";

export type Procedure<Args extends unknown[], Result> = (
  ...args: Args
) => Result;

export function fun<Args extends unknown[], Result>(): Schema<
  Procedure<Args, Result>,
  { type: "function" }
> {
  return makeSchema(
    (v) => {
      if (typeof v !== "function") {
        return makeIssue("wrong_type", v, "function");
      }
    },
    () => ({ type: "function" })
  );
}

export function arity<Args extends unknown[], M, Result>(
  schema: Schema<Procedure<Args, Result>, M>,
  arity: number
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v.length !== arity) {
        return makeIssue("arity", v, arity);
      }
    },
    { arity }
  );
}
