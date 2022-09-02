import { makeSchema, refine, Schema } from "./schema";
import { makeValidation } from "./validation";

export type Procedure<Args extends unknown[], Result> = (
  ...args: Args
) => Result;

export function fun<Args extends unknown[], Result>(): Schema<
  Procedure<Args, Result>
> {
  return makeSchema((v) =>
    makeValidation(typeof v === "function", "value should be a function")
  );
}

export function arity<Args extends unknown[], Result>(
  schema: Schema<Procedure<Args, Result>>,
  arity: number
): Schema<Procedure<Args, Result>> {
  return refine(schema, (v) =>
    makeValidation(v.length === arity, `function should have arity ${arity}`)
  );
}
