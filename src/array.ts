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
export function min<T, M>(schema: Schema<T[], M>, minLength: number) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v.length < minLength) {
        return `value should contain at least ${minLength} items`;
      }
    },
    { min: minLength }
  );
}
export function max<T, M>(schema: Schema<T[], M>, maxLength: number) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v.length > maxLength) {
        return `value should contain at most ${maxLength} items`;
      }
    },
    { max: maxLength }
  );
}
export function length<T, M>(schema: Schema<T[], M>, length: number) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v.length === length) {
        return `value should contain exactly ${length} items`;
      }
    },
    { min: length, max: length }
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
export function nonEmpty<T, M>(schema: Schema<T[], M>) {
  return min(schema, 1);
}
