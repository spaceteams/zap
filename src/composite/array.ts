import {
  getOption,
  makeSchema,
  refine,
  refineWithMetainformation,
  Schema,
} from "../schema";
import {
  isFailure,
  isSuccess,
  ValidationIssue,
  ValidationResult,
} from "../validation";

export function array<I, O, M>(
  schema: Schema<I, O, M>,
  issues?: Partial<{
    required: string;
    wrongType: string;
  }>
): Schema<I[], O[], { type: "array"; schema: Schema<I, O, M> }> {
  return makeSchema(
    (v, o) => {
      if (typeof v === "undefined" || v === null) {
        return new ValidationIssue("required", issues?.required, v);
      }
      if (!Array.isArray(v)) {
        return new ValidationIssue("wrong_type", issues?.wrongType, v, "array");
      }

      const validations: ValidationResult<I[]> = [];
      for (const value of v) {
        const validation = schema.validate(value, o);
        validations.push(validation);

        if (getOption(o, "earlyExit") && isFailure(validation)) {
          return validations;
        }
      }
      if (validations.every((v) => isSuccess(v))) {
        return;
      }
      return validations;
    },
    async (v, o) => {
      if (typeof v === "undefined" || v === null) {
        return new ValidationIssue("required", issues?.required, v);
      }
      if (!Array.isArray(v)) {
        return new ValidationIssue("wrong_type", issues?.wrongType, v, "array");
      }

      const validations: ValidationResult<I[]> = [];
      for (const value of v) {
        const validation = await schema.validateAsync(value, o);
        validations.push(validation);

        if (getOption(o, "earlyExit") && isFailure(validation)) {
          return validations;
        }
      }
      if (validations.every((v) => isSuccess(v))) {
        return;
      }
      return validations;
    },
    () => ({ type: "array", schema }),
    (v, o) => v.map((item) => schema.parse(item, o).parsedValue) as O[]
  );
}
export function minItems<I, O, M>(
  schema: Schema<I[], O, M>,
  minItems: number,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v.length < minItems) {
        return new ValidationIssue("minItems", issue, v, minItems);
      }
    },
    { minItems }
  );
}
export function maxItems<I, O, M>(
  schema: Schema<I[], O, M>,
  maxItems: number,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v.length > maxItems) {
        return new ValidationIssue("maxItems", issue, v, maxItems);
      }
    },
    { maxItems }
  );
}
export function items<I, O, M>(
  schema: Schema<I[], O, M>,
  items: number,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v.length === items) {
        return new ValidationIssue("items", issue, v, items);
      }
    },
    { minItems: items, maxItems: items }
  );
}
export function uniqueItems<I, O, M>(
  schema: Schema<I[], O, M>,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      const seen = new Set();
      const hasDuplicates = v.some((item) => {
        if (seen.has(item)) {
          return true;
        }
        seen.add(item);
        return false;
      });
      if (hasDuplicates) {
        return new ValidationIssue("uniqueItems", issue, v);
      }
    },
    { uniqueItems: true }
  );
}
export function includes<I, O, M>(
  schema: Schema<I[], O, M>,
  element: I,
  fromIndex: number,
  issue?: string
) {
  return refine(schema, (v) => {
    if (!v.includes(element, fromIndex)) {
      return new ValidationIssue("includes", issue, v, element, fromIndex);
    }
  });
}
export function nonEmptyArray<I, O, M>(
  schema: Schema<I[], O, M>,
  issue?: string
) {
  return minItems(schema, 1, issue);
}
