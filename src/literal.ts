import { Unionize } from "./or";
import { makeSchema, Schema } from "./schema";
import { Validation } from "./validation";

export type Literal = number | string | boolean;

export function literal<T extends Literal>(
  literal: T
): Schema<typeof literal, { type: "literal"; literal: T }> {
  type V = Validation<typeof literal>;
  return makeSchema(
    (v) => {
      if (
        typeof v !== "string" &&
        typeof v !== "symbol" &&
        typeof v !== "number"
      ) {
        return "value is not a literal" as V;
      }
      if (v !== literal) {
        return `value should literally be ${literal as string}` as V;
      }
    },
    () => ({ type: "literal", literal })
  );
}

export function literals<T extends Literal[]>(
  ...literals: T
): Schema<Unionize<T>, { type: "literals"; literals: T }> {
  type V = Validation<Unionize<T>>;
  return makeSchema(
    (v) => {
      if (
        typeof v !== "string" &&
        typeof v !== "symbol" &&
        typeof v !== "number"
      ) {
        return "value is not a literal" as V;
      }
      if (!literals.includes(v as Literal)) {
        return `value should literally be one of [${literals.join(",")}]` as V;
      }
    },
    () => ({ type: "literals", literals })
  );
}
