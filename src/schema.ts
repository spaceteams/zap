import { isFailure, isSuccess, ValidationResult } from "./validation";

export interface Schema<T, R = T> {
  /**
   * a typeguard of type T
   * this method is constructed by the makeSchema function
   * @param v the value to be checked
   */
  accepts: (v: unknown) => v is T;
  /**
   * builds a validation object containing all validation errors of the object
   * @param v the value to be checked
   */
  validate: (v: unknown) => ValidationResult<T>;
  /**
   * validates a value and returns it
   * the result can be additionally transformed into result type R (see transform method)
   * @param v the value to be parsed
   * @throws Validation<T> if validation of v fails
   */
  parse: (v: unknown) => R;
}

/**
 * A helper function to create a schema from a validation function.
 * @param validate the validation method
 * @returns the schema
 */
export function makeSchema<T>(validate: Schema<T>["validate"]): Schema<T> {
  return {
    accepts: (v): v is T => isSuccess(validate(v)),
    parse: (v) => {
      const validation = validate(v);
      if (isFailure(validation)) {
        throw validation;
      }
      return v as T;
    },
    validate,
  };
}

/**
 * Refines a schema further.
 *
 * For example
 * ```
 * refine(number, v =>
 *   makeValidation(v % 2 === 0, "must be even!")
 * )
 * ```
 * will accept only even numbers.
 *
 * @param schema the base schema
 * @param validate the additional validation function
 * @returns the refined schema
 */
export function refine<T>(
  schema: Schema<T>,
  validate: (v: T) => ValidationResult<T>
): Schema<T> {
  return makeSchema((v) => {
    const validation = schema.validate(v);
    if (isFailure(validation)) {
      return validation;
    }
    return validate(v as T);
  });
}

/**
 * Preprocesses data before parsing (aka coercion).
 *
 * For example
 * ```
 * coerce(number(), Number)
 * ```
 * will result in a schema that will accept numbers,
 * string, boolean through native js coercion. It will
 * not accept ['a'] however, because that will coerce
 * into NaN which is not acceptable for number().
 *
 * @param schema the base schema to coerce values into
 * @param coercion the coercion function
 * @returns the coerced schema
 */
export function coerce<T>(
  schema: Schema<T>,
  coercion: (v: unknown) => unknown
): Schema<T> {
  return {
    accepts: (v): v is T => schema.accepts(coercion(v)),
    parse: (v) => schema.parse(coercion(v)),
    validate: (v) => schema.validate(coercion(v)),
  };
}

/**
 * Tries to parse a source value into the schema or
 * fail otherwhise (resulting in undefined)
 * @param schema the base schema to coerce values into
 * @returns the coerced schema
 */
export function json<T>(schema: Schema<T>): Schema<T> {
  return coerce(schema, (v) =>
    typeof v === "string" ? JSON.parse(v) : undefined
  );
}

/**
 * Transforms the parse result into another type.
 * Note that the validation type (T) remains the same
 * and only the result type (R) is modified.
 * It is used to implement @see default()
 *
 * @param schema the base schema
 * @param transformer the transformer function
 * @returns the transformed schema
 */
export function transform<T, R>(
  schema: Schema<T>,
  transformer: (v: T) => R
): Schema<T, R> {
  return {
    accepts: (v): v is T => schema.accepts(v),
    parse: (v) => transformer(schema.parse(v)),
    validate: (v) => schema.validate(v),
  };
}

export type InferResultType<T> = T extends Schema<unknown, infer U> ? U : never;
export type InferResultTypes<T extends [...unknown[]]> = T extends [
  infer Head,
  ...infer Tail
]
  ? [InferResultType<Head>, ...InferResultTypes<Tail>]
  : [];

export type InferType<T> = T extends Schema<infer U, unknown> ? U : never;
export type InferTypes<T extends [...unknown[]]> = T extends [
  infer Head,
  ...infer Tail
]
  ? [InferType<Head>, ...InferTypes<Tail>]
  : [];
