import { makeSchema, Schema } from "../schema";

export function memoize<T>(provider: () => T): () => T {
  let memoized = false;
  let value: T | undefined;
  return () => {
    if (!memoized) {
      value = provider();
      memoized = true;
    }
    return value as T;
  };
}

export function lazy<I, O, M>(schema: () => Schema<I, O, M>): Schema<I, O, M> {
  const memo = memoize(schema);
  return makeSchema(
    (v, o) => memo().validate(v, o),
    () => memo().meta(),
    (v, o) => memo().parse(v, o)
  );
}
