import { makeSchema, Schema, Validation } from "./schema";

export function literal<T extends number | string | boolean>(
  literal: T
): Schema<typeof literal> {
  return makeSchema(
    (v) =>
      (v === literal
        ? undefined
        : `value should literally be ${literal as string}`) as Validation<
        typeof literal
      >
  );
}
