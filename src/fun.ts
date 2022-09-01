import { makeSchema, refine, Schema } from "./schema";

export function fun<Args extends unknown[], Result>(): Schema<
  (...args: Args) => Result
> {
  return makeSchema((v) =>
    typeof v === "function" ? undefined : "value should be a function"
  );
}

export function arity<Args extends unknown[], Result>(
  schema: Schema<(...args: Args) => Result>,
  arity: number
): Schema<(...args: Args) => Result> {
  return refine(schema, (v) =>
    v.length === arity ? undefined : `function should have arity ${arity}`
  );
}
