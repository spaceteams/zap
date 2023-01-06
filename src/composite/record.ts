import { getOption, makeSchema, Schema } from "../schema";
import { string } from "../simple";
import {
  isFailure,
  isSuccess,
  Validation,
  ValidationIssue,
  ValidationResult,
} from "../validation";

export function record<I, O, M>(
  schema: Schema<I, O, M>,
  issues?: Partial<{
    required: string;
    wrongType: string;
  }>
) {
  return keyedRecord(string(), schema, issues);
}

export function keyedRecord<K extends string | number | symbol, N, I, O, M>(
  key: Schema<K, K, N>,
  schema: Schema<I, O, M>,
  issues?: Partial<{
    required: string;
    wrongType: string;
    invalidKey: string;
  }>
): Schema<
  Record<K, I>,
  Record<K, O>,
  { type: "record"; schema: { key: Schema<K, K, N>; value: Schema<I, O, M> } }
> {
  type ResultI = Record<K, I>;
  type ResultO = Record<K, O>;
  type V = ValidationResult<ResultI>;

  const preValidate = (v: unknown) => {
    if (typeof v === "undefined" || v === null) {
      return new ValidationIssue("required", issues?.required, v) as V;
    }
    if (typeof v !== "object") {
      return new ValidationIssue(
        "wrong_type",
        issues?.wrongType,
        v,
        "object"
      ) as V;
    }
  };

  class Aggregator {
    constructor(readonly earlyExit: boolean) {}

    public readonly validations: { [key: string]: unknown } = {};

    onKeyValidation(
      k: string,
      value: unknown,
      validation: ValidationResult<K>
    ): boolean {
      if (isSuccess(validation)) {
        return false;
      }
      this.validations[k] = new ValidationIssue(
        "invalid_key",
        issues?.invalidKey,
        value,
        validation
      ) as Validation<I>;
      return this.earlyExit;
    }

    onValidation(k: string, validation: ValidationResult<I>) {
      if (isSuccess(validation)) {
        return false;
      }
      this.validations[k] = validation;
      return this.earlyExit;
    }

    result(): V {
      if (Object.keys(this.validations).length === 0) {
        return;
      }
      return this.validations as V;
    }
  }

  return makeSchema(
    (v, o) => {
      const validation = preValidate(v);
      if (isFailure(validation)) {
        return validation;
      }

      const aggregator = new Aggregator(getOption(o, "earlyExit"));
      for (const [k, value] of Object.entries(v as Record<string, unknown>)) {
        const keyValidation = key.validate(k, o);
        if (aggregator.onKeyValidation(k, value, keyValidation)) {
          break;
        }

        const validation = schema.validate(value, o);
        if (aggregator.onValidation(k, validation)) {
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
      for (const [k, value] of Object.entries(v as Record<string, unknown>)) {
        const keyValidation = await key.validateAsync(k, o);
        if (aggregator.onKeyValidation(k, value, keyValidation)) {
          break;
        }

        const validation = await schema.validateAsync(value, o);
        if (aggregator.onValidation(k, validation)) {
          break;
        }
      }
      return aggregator.result();
    },
    () => ({ type: "record", schema: { key, value: schema } }),
    (v, o) => {
      const result: Partial<ResultO> = {};
      for (const [k, value] of Object.entries(v)) {
        const parsedKey = key.parse(k).parsedValue;
        result[parsedKey as K] = schema.parse(value, o).parsedValue;
      }
      return result as ResultO;
    }
  );
}
