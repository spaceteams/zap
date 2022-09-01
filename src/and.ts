import { isFailure, makeSchema, Schema, Validation } from "./schema";

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
export function and<S, T>(left: Schema<S>, right: Schema<T>): Schema<S & T> {
  return makeSchema((v) => {
    const leftValidation = left.validate(v);
    const rightValidation = right.validate(v);
    if (isFailure(leftValidation)) {
      return mergeValidations(leftValidation, rightValidation);
    }
    return right.validate(v) as Validation<S & T> | undefined;
  });
}
