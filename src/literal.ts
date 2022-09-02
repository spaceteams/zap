import { makeSchema, Schema } from "./schema";
import { makeValidation, Validation } from "./validation";

export function literal<T extends number | string | boolean>(
  literal: T
): Schema<typeof literal> {
  return makeSchema((v) =>
    makeValidation<typeof literal>(
      v === literal,
      // FIXME: this cast should be unnecessary
      `value should literally be ${literal as string}` as Validation<
        typeof literal
      >
    )
  );
}
