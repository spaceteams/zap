import { makeSchema, Schema } from "./schema";
import { isFailure, Validation } from "./validation";

export function mergeValidations<S, T>(
  left: Validation<S> | undefined,
  right: Validation<T> | undefined
): Validation<S & T> | undefined {
  if (typeof left === "string") {
    // FIXME: this cast should be unnecessary
    return left as Validation<S & T>;
  }
  if (Array.isArray(left)) {
    if (Array.isArray(right)) {
      // FIXME: this cast should be unnecessary
      return [...left, ...right] as Validation<S & T>;
    }
    return left as Validation<S & T>;
  }
  if (typeof left === "object") {
    if (typeof right === "object") {
      // FIXME: this cast should be unnecessary
      return { ...(left as object), ...(right as object) } as Validation<S & T>;
    }
    // FIXME: this cast should be unnecessary
    return left as Validation<S & T>;
  }
  // FIXME: this cast should be unnecessary
  return right as Validation<S & T>;
}
export function and<S, T>(left: Schema<S>, right: Schema<T>): Schema<S & T> {
  return makeSchema((v) => {
    const leftValidation = left.validate(v);
    const rightValidation = right.validate(v);
    if (isFailure(leftValidation)) {
      return mergeValidations(leftValidation, rightValidation);
    }
    // FIXME: this cast should be unnecessary
    return rightValidation as Validation<S & T> | undefined;
  });
}
