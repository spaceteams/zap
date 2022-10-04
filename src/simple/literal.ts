import { Unionize } from "../utility";
import { makeSchema, Schema } from "../schema";
import { makeIssue, Validation } from "../validation";

export type Literal = number | string | boolean | symbol;

export function literal<T extends Literal>(
  literal: T,
  issues?: Partial<{
    required: string;
    wrongType: string;
    literal: string;
  }>
): Schema<typeof literal, { type: "literal"; literal: T }> {
  type V = Validation<typeof literal>;
  return makeSchema(
    (v) => {
      if (typeof v === "undefined" || v === null) {
        return makeIssue("required", issues?.required, v) as V;
      }
      if (
        typeof v !== "string" &&
        typeof v !== "symbol" &&
        typeof v !== "number"
      ) {
        return makeIssue(
          "wrong_type",
          issues?.wrongType,
          v,
          "string",
          "symbol",
          "number"
        ) as V;
      }
      if (v !== literal) {
        return makeIssue("literal", issues?.literal, v, literal) as V;
      }
    },
    () => ({ type: "literal", literal })
  );
}

export function literals<T extends Literal[]>(
  ...literals: T
): Schema<Unionize<T>, { type: "literals"; literals: T }> {
  return literalsWithIssues(literals);
}

export function literalsWithIssues<T extends readonly Literal[]>(
  literals: T,
  issues?: Partial<{
    required: string;
    wrongType: string;
    literal: string;
  }>
): Schema<Unionize<T>, { type: "literals"; literals: T }> {
  type V = Validation<Unionize<T>>;
  return makeSchema(
    (v) => {
      if (typeof v === "undefined" || v === null) {
        return makeIssue("required", issues?.required, v) as V;
      }
      if (
        typeof v !== "string" &&
        typeof v !== "symbol" &&
        typeof v !== "number"
      ) {
        return makeIssue(
          "wrong_type",
          issues?.wrongType,
          v,
          "string",
          "symbol",
          "number"
        ) as V;
      }
      if (!literals.includes(v as Literal)) {
        return makeIssue("literal", issues?.literal, v, ...literals) as V;
      }
    },
    () => ({ type: "literals", literals })
  );
}
