import { getOption, makeSchema, Schema } from "../schema";
import { string } from "../simple";
import {
  isFailure,
  ValidationIssue,
  Validation,
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
  { type: "record"; schema: Schema<I, O, M>; key: Schema<K, K, N> }
> {
  type ResultI = Record<K, I>;
  type ResultO = Record<K, O>;
  type V = ValidationResult<ResultI>;
  return makeSchema(
    (v, o) => {
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
      const validation: { [key: string]: unknown } = {};
      for (const [k, value] of Object.entries(v)) {
        const keyValidation = key.validate(k, o);
        if (isFailure(keyValidation)) {
          validation[k] = new ValidationIssue(
            "invalid_key",
            issues?.invalidKey,
            value,
            keyValidation
          ) as Validation<I>;
          if (getOption(o, "earlyExit")) {
            return validation as V;
          }
        }

        const innerValidation = schema.validate(value, o);
        if (isFailure(innerValidation)) {
          validation[k] = innerValidation;
          if (getOption(o, "earlyExit")) {
            return validation as V;
          }
        }
      }
      if (Object.keys(validation).length === 0) {
        return;
      }
      return validation as V;
    },
    () => ({ type: "record", schema, key }),
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
