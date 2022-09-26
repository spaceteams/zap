export type ValidationIssueCode =
  | "wrong_type"
  // array
  | "includes"
  | "items"
  | "maxItems"
  | "minItems"
  | "uniqueItems"
  // string
  | "minLength"
  | "maxLength"
  | "length"
  | "pattern"
  | "startsWith"
  | "endsWith"
  // number
  | "isNaN"
  | "positive"
  | "nonPositive"
  | "negative"
  | "nonNegative"
  | "multipleOf"
  | "exclusiveMaximum"
  | "exclusiveMinimum"
  | "maximum"
  | "minimum"
  // object
  | "additionalProperty"
  // fun
  | "arity"
  // enum
  | "enum"
  // date
  | "before"
  | "after"
  // literal/s
  | "literal"
  // logic
  | "xor"
  | "not";

const validationErrorMarker = Symbol();

export interface ValidationIssue {
  __marker: symbol;
  message: ValidationIssueCode | string;
  value: unknown;
  args?: unknown[];
}
export function isValidationError(v: unknown): v is ValidationIssue {
  return (
    typeof v === "object" &&
    (v as Record<string, unknown>)["__marker"] == validationErrorMarker
  );
}
export function makeIssue(
  message: ValidationIssueCode | string,
  value: unknown,
  ...args: unknown[]
): ValidationIssue {
  return {
    __marker: validationErrorMarker,
    message,
    value,
    args: args.length > 0 ? args : undefined,
  };
}

export type Validation<T, E = ValidationIssue> = T extends {
  [key: string]: unknown;
}
  ?
      | {
          [P in keyof T]?: Validation<T[P]>;
        }
      | E
  : T extends unknown[]
  ? (Validation<T[number]> | undefined)[] | E
  : E;

export type ValidationResult<T, E = ValidationIssue> =
  | Validation<T, E>
  | undefined;

export function isSuccess<T>(validation: ValidationResult<T>): boolean {
  return validation === undefined;
}
export function isFailure<T>(
  validation: ValidationResult<T>
): validation is Validation<T> {
  return validation !== undefined;
}

export function mergeValidations<S, T>(
  left: ValidationResult<S>,
  right: ValidationResult<T>
): ValidationResult<S & T> {
  if (isValidationError(left)) {
    return left as Validation<S & T>;
  }
  if (isValidationError(right)) {
    return right as Validation<S & T>;
  }
  if (Array.isArray(left)) {
    if (Array.isArray(right)) {
      return [...left, ...right] as Validation<S & T>;
    }
    return left as Validation<S & T>;
  }
  if (Array.isArray(right)) {
    return right as Validation<S & T>;
  }
  if (typeof left === "object") {
    if (typeof right === "object") {
      const validation = {};
      for (const key of Object.keys(left)) {
        if (right[key] !== undefined) {
          validation[key] = mergeValidations(left[key], right[key]);
        } else {
          validation[key] = left[key];
        }
      }
      for (const key of Object.keys(right)) {
        if (left[key] === undefined) {
          validation[key] = right[key];
        }
      }
      return validation as Validation<S & T>;
    }
    return left as Validation<S & T>;
  }
  return right as Validation<S & T>;
}

export function simplifyValidation<T>(
  v: ValidationResult<T>
): ValidationResult<T> {
  if (isValidationError(v)) {
    return v;
  }
  if (Array.isArray(v)) {
    if (v.every((inner) => inner === undefined)) {
      return undefined;
    }
    return v.map((inner) => simplifyValidation(inner)) as ValidationResult<T>;
  }
  if (typeof v === "object") {
    for (const key of Object.keys(v)) {
      const k = key as keyof typeof v;
      v[k] = simplifyValidation(
        v[k] as ValidationResult<unknown>
      ) as Validation<T, ValidationIssue>[keyof Validation<T, ValidationIssue>];
      if (v[k] === undefined) {
        delete v[k];
      }
    }
    if (Object.keys(v).length === 0) {
      return undefined;
    }
    return v;
  }
}

export function defaultTranslateError(validation: ValidationIssue) {
  switch (validation.message) {
    case "wrong_type": {
      if (
        typeof validation.value === "undefined" ||
        validation.value === null
      ) {
        return "value is required";
      }
      return `value was of type ${
        Array.isArray(validation.value) ? "array" : typeof validation.value
      } expected ${(validation.args ?? []).join(" or ")}`;
    }
    default: {
      if (validation.args && validation.args.length > 0) {
        return `${validation.message}(${validation.args.join(",")})`;
      }
      return validation.message;
    }
  }
}

export function translate<T>(
  validation: ValidationResult<T, ValidationIssue>,
  translateError: (
    validation: ValidationIssue
  ) => string = defaultTranslateError
): ValidationResult<T, string> {
  if (validation === undefined) {
    return undefined;
  }
  if (isValidationError(validation)) {
    return translateError(validation) as Validation<T, string>;
  }
  if (Array.isArray(validation)) {
    return validation.map((v) => translate(v)) as Validation<T, string>;
  }
  const result = {};
  for (const [key, value] of Object.entries(validation)) {
    result[key] = translate(
      value as ValidationResult<unknown, ValidationIssue>
    );
  }
  return result as Validation<T, string>;
}
