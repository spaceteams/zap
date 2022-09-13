import { makeSchema, refineWithMetainformation, Schema } from "./schema";

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
        return "value should be a function";
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
        return `function should have arity ${arity}`;
      }
    },
    { arity }
  );
}
