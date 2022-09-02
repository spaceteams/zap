/**
 * The validation type.
 * Validations are structurally equivalent to the type T except
 * that each type is partial in T and can also be a string.
 * For example a validation for
 * ```
 * interface User {
 *   name: string
 *   age: number
 *   cards: {
 *     no: string
 *   }[]
 * }
 * ```
 * could be
 * ```
 * {
 *   name: "not a string"
 *   cards: [
 *     { no: "missing" },
 *     undefined,
 *     "not an object"
 *   ]
 * }
 * ```
 */
export type Validation<T> = T extends { [key: string]: unknown }
  ?
      | {
          [P in keyof T]?: Validation<T[P]>;
        }
      | string
  : T extends unknown[]
  ? Validation<T[number]>[] | string
  : string;

export type ValidationResult<T> = Validation<T> | undefined;

export function makeValidation<T>(
  valid: boolean,
  message: (() => ValidationResult<T>) | ValidationResult<T>,
  onValid?: () => ValidationResult<T>
): ValidationResult<T> {
  const getMessage = () =>
    typeof message === "function" ? message() : message;
  return valid ? onValid && onValid() : getMessage();
}

export function isSuccess<T>(validation: ValidationResult<T>): boolean {
  return validation === undefined;
}
export function isFailure<T>(
  validation: ValidationResult<T>
): validation is Validation<T> {
  return validation !== undefined;
}
