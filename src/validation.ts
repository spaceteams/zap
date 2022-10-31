export type ValidationIssueCode =
  | "generic"
  | "required"
  | "wrong_type"
  | "invalid_key"
  // async
  | "async_validation_required"
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
  | "integer"
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
  | "invalid_arguments"
  | "invalid_return"
  | "arity"
  // promise
  | "invalid_promise"
  // enum
  | "enum"
  // date
  | "before"
  | "after"
  // literal/s
  | "literal"
  // async
  // logic
  | "xor"
  | "not";

export class ValidationIssue extends Error {
  public readonly args?: unknown[];

  constructor(
    public readonly code: ValidationIssueCode,
    message: string | undefined,
    public readonly value: unknown,
    ...args: unknown[]
  ) {
    super(message);
    if (args?.length > 0) {
      this.args = args;
    }
  }
}
export function isValidationIssue(v: unknown): v is ValidationIssue {
  return v instanceof ValidationIssue;
}

export type Validation<T, E = ValidationIssue> = T extends Set<infer U>
  ? Set<Validation<U>> | E
  : T extends Map<infer K, infer U>
  ? Map<K, Validation<U>> | E
  : T extends Record<string, unknown>
  ? { [P in keyof T]?: Validation<T[P]> } | E
  : T extends unknown[]
  ? (Validation<T[number]> | undefined)[] | E
  : E;

export type ValidationResult<T, E = ValidationIssue> =
  | Validation<T, E>
  | undefined;

export function isSuccess<T>(
  validation: ValidationResult<T>
): validation is undefined {
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
  if (isValidationIssue(left)) {
    return left as Validation<S & T>;
  }
  if (isValidationIssue(right)) {
    return right as Validation<S & T>;
  }

  // Array
  if (Array.isArray(left)) {
    if (Array.isArray(right)) {
      return [...left, ...right] as Validation<S & T>;
    }
    return left as Validation<S & T>;
  }
  if (Array.isArray(right)) {
    return right as Validation<S & T>;
  }

  // Set
  if (left instanceof Set) {
    if (right instanceof Set) {
      const validation = new Set();
      for (const value of left.values()) {
        validation.add(value);
      }
      for (const value of right.values()) {
        validation.add(value);
      }
      return validation as Validation<S & T>;
    }
    return left as Validation<S & T>;
  }
  if (right instanceof Set) {
    return right as Validation<S & T>;
  }

  // Map
  if (left instanceof Map) {
    if (right instanceof Map) {
      const validation = new Map();

      for (const key of left.keys()) {
        if (right.has(key)) {
          validation.set(key, mergeValidations(left.get(key), right.get(key)));
        } else {
          validation.set(key, left.get(key));
        }
      }
      for (const key of right.keys()) {
        if (!left.has(key)) {
          validation.set(key, right.get(key));
        }
      }
      return validation as Validation<S & T>;
    }
    return left as Validation<S & T>;
  }
  if (right instanceof Map) {
    return right as Validation<S & T>;
  }

  // object
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
  if (isValidationIssue(v)) {
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

export function defaultTranslateError({
  message,
  code,
  value,
  args,
}: ValidationIssue): string {
  if (message) {
    return message;
  }
  const innerError = () =>
    args && args.length > 0
      ? defaultTranslateError(args[0] as ValidationIssue)
      : "";

  switch (code) {
    case "required": {
      return "value is required";
    }
    case "wrong_type": {
      return `value was of type ${
        Array.isArray(value) ? "array" : typeof value
      } expected ${(args ?? []).join(" or ")}`;
    }
    case "invalid_arguments":
    case "invalid_return":
    case "invalid_key": {
      return `${code}: ${innerError()}`;
    }
    default: {
      if (args && args.length > 0) {
        return `${code}(${args.join(",")})`;
      }
      return code;
    }
  }
}

export function translate<T>(
  validation: ValidationResult<T, ValidationIssue>,
  translateError: (
    validation: ValidationIssue
  ) => string = defaultTranslateError
): ValidationResult<T, string> {
  if (isSuccess(validation)) {
    return;
  }
  if (isValidationIssue(validation)) {
    return translateError(validation) as Validation<T, string>;
  }
  if (Array.isArray(validation)) {
    return validation.map((v) => translate(v)) as Validation<T, string>;
  }
  if (validation instanceof Set) {
    const result = new Set();
    for (const value of validation) {
      result.add(
        translate(value as ValidationResult<unknown, ValidationIssue>)
      );
    }
    return result as Validation<T, string>;
  }
  if (validation instanceof Map) {
    const result = new Map();
    for (const [key, value] of validation.entries()) {
      result.set(
        key,
        translate(value as ValidationResult<unknown, ValidationIssue>)
      );
    }
    return result as Validation<T, string>;
  }
  const result = {};
  for (const [key, value] of Object.entries(validation)) {
    result[key] = translate(
      value as ValidationResult<unknown, ValidationIssue>
    );
  }
  return result as Validation<T, string>;
}
