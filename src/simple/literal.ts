import { Unionize } from "../utility";
import { makeSchema, Schema } from "../schema";
import { makeIssue, Validation } from "../validation";

export type Literal = number | string | boolean | symbol;

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
        return makeIssue("wrong_type", v, "string", "symbol", "number") as V;
      }
      if (v !== literal) {
        return makeIssue("literal", v, literal) as V;
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
        return makeIssue("wrong_type", v, "string", "symbol", "number") as V;
      }
      if (!literals.includes(v as Literal)) {
        return makeIssue("literal", v, ...literals) as V;
      }
    },
    () => ({ type: "literals", literals })
  );
}
