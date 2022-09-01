import { makeSchema, Schema } from "./schema";

export function memoize<T>(provider: () => T): () => T {
  let memoized = false;
  let value: T | undefined;
  return () => {
    if (!memoized) {
      value = provider();
      memoized = true;
    }
    return value;
  };
}

export function lazy<T>(schema: () => Schema<T>): Schema<T> {
  const memo = memoize(schema);
  return makeSchema((v) => memo().validate(v));
}
