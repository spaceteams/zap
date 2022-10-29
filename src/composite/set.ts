import { getOption, makeSchema, Schema } from "../schema";
import { isFailure, ValidationIssue, ValidationResult } from "../validation";

export function set<I, O, M>(
  schema: Schema<I, O, M>,
  issues?: Partial<{
    required: string;
    wrongType: string;
  }>
): Schema<Set<I>, Set<O>, { type: "set"; schema: Schema<I, O, M> }> {
  return makeSchema(
    (v, o) => {
      if (typeof v === "undefined" || v === null) {
        return new ValidationIssue("required", issues?.required, v);
      }
      if (!(v instanceof Set)) {
        return new ValidationIssue("wrong_type", issues?.wrongType, v, "set");
      }
      const validations: ValidationResult<Set<I>> = new Set();
      for (const value of v) {
        const validation = schema.validate(value, o);
        if (isFailure(validation)) {
          validations.add(validation);
          if (getOption(o, "earlyExit")) {
            return validations;
          }
        }
      }
      if (validations.size === 0) {
        return;
      }
      return validations;
    },
    async (v, o) => {
      if (typeof v === "undefined" || v === null) {
        return new ValidationIssue("required", issues?.required, v);
      }
      if (!(v instanceof Set)) {
        return new ValidationIssue("wrong_type", issues?.wrongType, v, "set");
      }
      const validations: ValidationResult<Set<I>> = new Set();
      for (const value of v) {
        const validation = await schema.validateAsync(value, o);
        if (isFailure(validation)) {
          validations.add(validation);
          if (getOption(o, "earlyExit")) {
            return validations;
          }
        }
      }
      if (validations.size === 0) {
        return;
      }
      return validations;
    },
    () => ({ type: "set", schema }),
    (v, o) => {
      const result = new Set<O>();
      for (const value of v) {
        result.add(schema.parse(value, o).parsedValue as O);
      }
      return result;
    }
  );
}
