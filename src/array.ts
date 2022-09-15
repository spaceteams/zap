import {
  getOption,
  makeSchema,
  refine,
  refineWithMetainformation,
  Schema,
} from "./schema";
import { isFailure, isSuccess, ValidationResult } from "./validation";

export function array<T, M>(
  schema: Schema<T, M>
): Schema<T[], { type: "array"; schema: Schema<T, M> }> {
  return makeSchema(
    (v, o) => {
      if (!Array.isArray(v)) {
        return "value should be an array";
      }

      const validations: ValidationResult<T[]> = [];
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
    () => ({ type: "array", schema })
  );
}
export function minItems<T, M>(schema: Schema<T[], M>, minItems: number) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v.length < minItems) {
        return `value should contain at least ${minItems} items`;
      }
    },
    { minItems }
  );
}
export function maxItems<T, M>(schema: Schema<T[], M>, maxItems: number) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v.length > maxItems) {
        return `value should contain at most ${maxItems} items`;
      }
    },
    { maxItems }
  );
}
export function items<T, M>(schema: Schema<T[], M>, items: number) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v.length === length) {
        return `value should contain exactly ${length} items`;
      }
    },
    { minItems: items, maxItems: items }
  );
}
export function uniqueItems<T, M>(schema: Schema<T[], M>) {
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
        return "value should only contain unique items";
      }
    },
    { uniqueItems: true }
  );
}
export function includes<T, M>(
  schema: Schema<T[], M>,
  element: T,
  fromIndex: number
) {
  return refine(schema, (v) => {
    if (!v.includes(element, fromIndex)) {
      return "value should contain given element";
    }
  });
}
export function nonEmptyArray<T, M>(schema: Schema<T[], M>) {
  return minItems(schema, 1);
}
