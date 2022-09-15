import { getOption, InferTypes, makeSchema, Schema } from "./schema";
import { isFailure, Validation, ValidationResult } from "./validation";

export type Intersect<T extends [...unknown[]]> = T extends [
  infer Head,
  ...infer Tail
]
  ? Head & Intersect<Tail>
  : unknown;

export function mergeValidations<S, T>(
  left: Validation<S> | undefined,
  right: Validation<T> | undefined
): Validation<S & T> | undefined {
  if (typeof left === "string") {
    return left as Validation<S & T>;
  }
  if (Array.isArray(left)) {
    if (Array.isArray(right)) {
      return [...left, ...right] as Validation<S & T>;
    }
    return left as Validation<S & T>;
  }
  if (typeof left === "object") {
    if (typeof right === "object") {
      return { ...(left as object), ...(right as object) } as Validation<S & T>;
    }
    return left as Validation<S & T>;
  }
  return right as Validation<S & T>;
}
export function and<T extends Schema<unknown, unknown>[]>(
  ...schemas: T
): Schema<Intersect<InferTypes<T>>, { type: "and"; schemas: T }> {
  return makeSchema(
    (v, o) => {
      let result: ValidationResult<unknown>;
      for (const schema of schemas) {
        result = mergeValidations(result, schema.validate(v));
        if (isFailure(result) && getOption(o, "earlyExit")) {
          break;
        }
      }
      return result as ValidationResult<Intersect<InferTypes<T>>>;
    },
    () => ({ type: "and", schemas })
  );
}
