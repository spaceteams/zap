import { makeSchema, Schema } from "./schema";
import { Validation } from "./validation";

export function literal<T extends number | string | boolean>(
  literal: T
): Schema<typeof literal> {
  type V = Validation<typeof literal>;
  return makeSchema((v) => {
    if (v !== literal) {
      return `value should literally be ${literal as string}` as V;
    }
  });
}
