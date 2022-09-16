import { getOption, refine, refineWithMetainformation, Schema } from "./schema";
import {
  isFailure,
  isSuccess,
  makeError,
  ValidationResult,
} from "./validation";

export function array<T, M>(
  schema: Schema<T, M>
): Schema<T[], { type: "array"; schema: Schema<T, M> }> {
  const validate: Schema<T[], unknown>["validate"] = (v, o) => {
    if (!Array.isArray(v)) {
      return makeError("wrong_type", v, "array");
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
  };
  return {
    accepts: (v, o): v is T[] => isSuccess(validate(v, o)),
    validate,
    parse: (v, o) => {
      if (!getOption(o, "skipValidation")) {
        const validation = validate(v, o);
        if (isFailure(validation)) {
          throw validation;
        }
      }
      return (v as T[]).map((item) => schema.parse(item));
    },
    meta: () => ({ type: "array", schema }),
  };
}
export function minItems<T, M>(schema: Schema<T[], M>, minItems: number) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v.length < minItems) {
        return makeError("invalid_value", v, "minItems", minItems);
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
        return makeError("invalid_value", v, "maxItems", maxItems);
      }
    },
    { maxItems }
  );
}
export function items<T, M>(schema: Schema<T[], M>, items: number) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v.length === items) {
        return makeError("invalid_value", v, "items", items);
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
        return makeError("invalid_value", v, "uniqueItems");
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
      return makeError("invalid_value", v, "includes", element, fromIndex);
    }
  });
}
export function nonEmptyArray<T, M>(schema: Schema<T[], M>) {
  return minItems(schema, 1);
}
