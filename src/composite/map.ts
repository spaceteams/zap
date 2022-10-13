import { getOption, makeSchema, Schema } from "../schema";
import {
  isFailure,
  makeIssue,
  Validation,
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
  { type: "map"; schema: Schema<I, O, M>; key: Schema<K, K, N> }
> {
  return makeSchema(
    (v, o) => {
      if (typeof v === "undefined" || v === null) {
        return makeIssue("required", issues?.required, v);
      }
      if (!(v instanceof Map)) {
        return makeIssue("wrong_type", issues?.wrongType, v, "set");
      }
      const validations: ValidationResult<Map<K, I>> = new Map();
      for (const [k, value] of v) {
        const keyValidation = key.validate(k, o);
        if (isFailure(keyValidation)) {
          validations.set(
            k as K,
            makeIssue(
              "invalid_key",
              issues?.invalidKey,
              value,
              keyValidation
            ) as Validation<I>
          );
          if (getOption(o, "earlyExit")) {
            return validations;
          }
        }

        const validation = schema.validate(value, o);
        if (isFailure(validation)) {
          validations.set(k as K, validation);
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
    () => ({ type: "map", schema, key }),
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
