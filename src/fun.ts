import { makeSchema, refine, Schema } from "./schema";

export type Procedure<Args extends unknown[], Result> = (
  ...args: Args
) => Result;

export function fun<Args extends unknown[], Result>(): Schema<
  Procedure<Args, Result>
> {
  return makeSchema((v) => {
    if (typeof v !== "function") {
      return "value should be a function";
    }
  });
}

export function arity<Args extends unknown[], Result>(
  schema: Schema<Procedure<Args, Result>>,
  arity: number
): Schema<Procedure<Args, Result>> {
  return refine(schema, (v) => {
    if (v.length !== arity) {
      return `function should have arity ${arity}`;
    }
  });
}
