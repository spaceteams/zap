import { getOption, makeSchema, Schema } from "../schema";
import {
  isFailure,
  isSuccess,
  Validation,
  ValidationIssue,
  ValidationResult,
} from "../validation";

export function map<K extends string | number | symbol, N, I, O, M>(
  key: Schema<K, K, N>,
  schema: Schema<I, O, M>,
  issues?: Partial<{
    required: string;
    wrongType: string;
    invalidKey: string;
  }>
): Schema<
  Map<K, I>,
  Map<K, O>,
  { type: "map"; schema: { key: Schema<K, K, N>; value: Schema<I, O, M> } }
> {
  const preValidate = (v: unknown) => {
    if (v === undefined || v === null) {
      return new ValidationIssue("required", issues?.required, v);
    }
    if (!(v instanceof Map)) {
      return new ValidationIssue("wrong_type", issues?.wrongType, v, "map");
    }
  };

  class Aggregator {
    constructor(readonly earlyExit: boolean) {}

    public readonly validations: Map<K, Validation<I>> = new Map();

    onKeyValidation(
      k: K,
      value: unknown,
      validation: ValidationResult<K>
    ): boolean {
      if (isSuccess(validation)) {
        return false;
      }
      this.validations.set(
        k,
        new ValidationIssue(
          "invalid_key",
          issues?.invalidKey,
          value,
          validation
        ) as Validation<I>
      );
      return this.earlyExit;
    }

    onValidation(k: K, validation: ValidationResult<I>) {
      if (isSuccess(validation)) {
        return false;
      }
      this.validations.set(k, validation);
      return this.earlyExit;
    }

    result(): ValidationResult<Map<K, I>> {
      if (this.validations.size > 0) {
        return this.validations;
      }
    }
  }

  return makeSchema(
    (v, o) => {
      const validation = preValidate(v);
      if (isFailure(validation)) {
        return validation;
      }

      const aggregator = new Aggregator(getOption(o, "earlyExit"));
      for (const [k, value] of v as Map<unknown, unknown>) {
        const keyValidation = key.validate(k, o);
        if (aggregator.onKeyValidation(k as K, value, keyValidation)) {
          break;
        }
        const validation = schema.validate(value, o);
        if (aggregator.onValidation(k as K, validation)) {
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

      const aggregator = new Aggregator(getOption(o, "earlyExit"));
      for (const [k, value] of v as Map<unknown, unknown>) {
        const keyValidation = await key.validateAsync(k, o);
        if (aggregator.onKeyValidation(k as K, value, keyValidation)) {
          break;
        }
        const validation = await schema.validateAsync(value, o);
        if (aggregator.onValidation(k as K, validation)) {
          break;
        }
      }
      return aggregator.result();
    },
    () => ({ type: "map", schema: { key, value: schema } }),
    (v, o) => {
      const result = new Map<K, O>();
      for (const [k, value] of v) {
        result.set(
          key.parse(k).parsedValue as K,
          schema.parse(value, o).parsedValue as O
        );
      }
      return result;
    }
  );
}
