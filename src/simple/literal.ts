import { makeSimpleSchema, Schema } from "../schema";
import { Unionize } from "../utility";
import { Validation, ValidationIssue } from "../validation";

export type Literal = number | string | boolean | symbol;

export function literal<T extends Literal>(
  literal: T,
  issues?: Partial<{
    required: string;
    wrongType: string;
    literal: string;
  }>
): Schema<typeof literal, typeof literal, { type: "literal"; literal: T }> {
  type V = Validation<typeof literal>;
  return makeSimpleSchema(
    (v) => {
      if (v === undefined || v === null) {
        return new ValidationIssue("required", issues?.required, v) as V;
      }
      if (
        typeof v !== "string" &&
        typeof v !== "symbol" &&
        typeof v !== "number"
      ) {
        return new ValidationIssue(
          "wrong_type",
          issues?.wrongType,
          v,
          "string",
          "symbol",
          "number"
        ) as V;
      }
      if (v !== literal) {
        return new ValidationIssue("literal", issues?.literal, v, literal) as V;
      }
    },
    () => ({ type: "literal", literal })
  );
}

export function literals<T extends Literal[]>(
  ...literals: T
): Schema<Unionize<T>, Unionize<T>, { type: "literals"; literals: T }> {
  return literalsWithIssues(literals);
}

export function literalsWithIssues<T extends readonly Literal[]>(
  literals: T,
  issues?: Partial<{
    required: string;
    wrongType: string;
    literal: string;
  }>
): Schema<Unionize<T>, Unionize<T>, { type: "literals"; literals: T }> {
  type V = Validation<Unionize<T>>;
  return makeSimpleSchema(
    (v) => {
      if (v === undefined || v === null) {
        return new ValidationIssue("required", issues?.required, v) as V;
      }
      if (
        typeof v !== "string" &&
        typeof v !== "symbol" &&
        typeof v !== "number"
      ) {
        return new ValidationIssue(
          "wrong_type",
          issues?.wrongType,
          v,
          "string",
          "symbol",
          "number"
        ) as V;
      }
      if (!literals.includes(v as Literal)) {
        return new ValidationIssue(
          "literal",
          issues?.literal,
          v,
          ...literals
        ) as V;
      }
    },
    () => ({ type: "literals", literals })
  );
}
