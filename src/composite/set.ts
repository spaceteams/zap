import { getOption, makeSchema, Schema, ValidationOptions } from "../schema";
import {
  isFailure,
  isSuccess,
  Validation,
  ValidationIssue,
  ValidationResult,
} from "../validation";

export function set<I, O, M>(
  schema: Schema<I, O, M>,
  issues?: Partial<{
    required: string;
    wrongType: string;
  }>
): Schema<Set<I>, Set<O>, { type: "set"; schema: Schema<I, O, M> }> {
  class Aggregator {
    constructor(readonly options: Partial<ValidationOptions> | undefined) {}

    public readonly validations: Set<Validation<I>> = new Set();

    onValidate(validation: ValidationResult<I>): boolean {
      if (isSuccess(validation)) {
        return false;
      }
      this.validations.add(validation);
      return getOption(this.options, "earlyExit");
    }
    result(): ValidationResult<Set<I>> {
      if (this.validations.size === 0) {
        return;
      }
      return this.validations;
    }
  }

  const preValidate = (v: unknown) => {
    if (typeof v === "undefined" || v === null) {
      return new ValidationIssue("required", issues?.required, v);
    }
    if (!(v instanceof Set)) {
      return new ValidationIssue("wrong_type", issues?.wrongType, v, "set");
    }
  };

  return makeSchema(
    (v, o) => {
      const validation = preValidate(v);
      if (isFailure(validation)) {
        return validation;
      }

      const aggregator = new Aggregator(o);
      for (const value of v as Set<unknown>) {
        const validation = schema.validate(value, o);
        if (aggregator.onValidate(validation)) {
          break;
        }
      }
      return aggregator.result();
    },
    async (v, o) => {
      const validation = preValidate(v);
      if (isFailure(validation)) {
        return validation;
      }

      const aggregator = new Aggregator(o);
      for (const value of v as Set<unknown>) {
        const validation = await schema.validateAsync(value, o);
        if (aggregator.onValidate(validation)) {
          break;
        }
      }
      return aggregator.result();
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
