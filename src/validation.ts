export type ValidationMessage = "wrong_type" | "invalid_value";

const validationErrorMarker = Symbol();

export interface ValidationError {
  __marker: symbol;
  message: ValidationMessage | string;
  value: unknown;
  args?: unknown[];
}
export function isValidationError(v: unknown): v is ValidationError {
  return (
    typeof v === "object" &&
    (v as Record<string, unknown>)["__marker"] == validationErrorMarker
  );
}
export function makeError(
  message: ValidationMessage,
  value: unknown,
  ...args: unknown[]
): ValidationError {
  return {
    __marker: validationErrorMarker,
    message,
    value,
    args: args.length > 0 ? args : undefined,
  };
}
export function makeGenericError(
  message: string,
  value: unknown,
  ...args: unknown[]
): ValidationError {
  return {
    __marker: validationErrorMarker,
    message,
    value,
    args: args.length > 0 ? args : undefined,
  };
}

export type Validation<T, E = ValidationError> = T extends {
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

export type ValidationResult<T, E = ValidationError> =
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

export function defaultTranslateError(validation: ValidationError) {
  switch (validation.message) {
    case "invalid_value": {
      const [head, ...tail] = validation.args ?? [];
      return `validation failed: ${String(head)}(${(tail ?? []).join(",")})`;
    }
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
  }
  return validation.message;
}

export function translate<T>(
  validation: ValidationResult<T, ValidationError>,
  translateError: (
    validation: ValidationError
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
      value as ValidationResult<unknown, ValidationError>
    );
  }
  return result as Validation<T, string>;
}
