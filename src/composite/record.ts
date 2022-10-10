import { getOption, makeSchema, Schema } from "../schema";
import { string } from "../simple";
import { isFailure, makeIssue, ValidationResult } from "../validation";

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
        return makeIssue("required", issues?.required, v) as V;
      }
      if (typeof v !== "object") {
        return makeIssue("wrong_type", issues?.wrongType, v, "object") as V;
      }
      const validation: { [key: string]: unknown } = {};
      for (const [key, value] of Object.entries(v)) {
        const innerValidation = schema.validate(value, o);
        if (isFailure(innerValidation)) {
          validation[key] = innerValidation;
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
      for (const [key, value] of Object.entries(v)) {
        result[key] = schema.parse(value, o).parsedValue;
      }
      return result as ResultO;
    }
  );
}
