import { isFailure, isSuccess, ValidationResult } from "./validation";

interface ValidationOptions {
  earlyExit: boolean;
}
export const defaultOptions: ValidationOptions = {
  earlyExit: false,
};

export interface Schema<T> {
  /**
   * a typeguard of type T
   * this method is constructed by the makeSchema function
   * @param v the value to be checked
   */
  accepts: (v: unknown, options?: ValidationOptions) => v is T;
  /**
   * builds a validation object containing all validation errors of the object
   * @param v the value to be checked
   */
  validate: (v: unknown, options?: ValidationOptions) => ValidationResult<T>;
  /**
   * validates a value and returns it
   * the result can be additionally be coerced
   * @param v the value to be parsed
   * @throws Validation<T> if validation of v fails
   */
  parse: (v: unknown, options?: ValidationOptions) => T;
}

/**
 * A helper function to create a schema from a validation function.
 * @param validate the validation method
 * @returns the schema
 */
export function makeSchema<T>(validate: Schema<T>["validate"]): Schema<T> {
  return {
    accepts: (v, o): v is T => isSuccess(validate(v, o)),
    parse: (v, o) => {
      const validation = validate(v, o);
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
 * const userSchema = object({
 *   id: number(),
 *   name: string()
 * });
 * const refined = refine(userSchema, ({id}) => {
 *   if (id > 42) {
 *     return {
 *       name: "id is too high for this user",
 *     };
 *   }
 * });
 * ```
 * will validate the id and write it as a validation
 * error of the name.
 *
 * @param schema the base schema
 * @param validate the additional validation function
 * @returns the refined schema
 */
export function refine<T>(
  schema: Schema<T>,
  validate: (v: T, o: ValidationOptions) => ValidationResult<T> | void
): Schema<T> {
  return makeSchema((v, o) => {
    const validation = schema.validate(v, o);
    if (isFailure(validation)) {
      return validation;
    }
    return validate(v as T, o ?? defaultOptions) || undefined;
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
    accepts: (v, o): v is T => schema.accepts(coercion(v), o),
    parse: (v, o) => schema.parse(coercion(v), o),
    validate: (v, o) => schema.validate(coercion(v), o),
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

export type InferType<T> = T extends Schema<infer U> ? U : never;
export type InferTypes<T extends [...unknown[]]> = T extends [
  infer Head,
  ...infer Tail
]
  ? [InferType<Head>, ...InferTypes<Tail>]
  : [];
