import { defaultOptions, makeSchema, Schema } from "./schema";
import { isFailure, Validation } from "./validation";

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
  return makeSchema((v, o = defaultOptions) => {
    const leftValidation = left.validate(v, o);
    if (isFailure(leftValidation)) {
      if (o.earlyExit) {
        return leftValidation as Validation<S & T> | undefined;
      }
      const rightValidation = right.validate(v, o);
      return mergeValidations(leftValidation, rightValidation);
    } else {
      const rightValidation = right.validate(v, o);
      return rightValidation as Validation<S & T> | undefined;
    }
  });
}
