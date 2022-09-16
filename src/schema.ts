import { isFailure, isSuccess, ValidationResult } from "./validation";

export type ValidationOptions = { earlyExit: boolean };
export type ParsingOptions = { strip: boolean };
export type Options = ParsingOptions & ValidationOptions;
export const defaultOptions: Options = { earlyExit: false, strip: true };

export const getOption = (
  o: Partial<Options> | undefined,
  key: keyof Options
) => o?.[key] ?? defaultOptions[key];

/**
 * A Schema of type T that can be used to typeguard, validate and parse values.
 * It also has a metadata type M that allows introspection.
 */
export interface Schema<T, M> {
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
  validate: (v: unknown, options?: ValidationOptions) => ValidationResult<T>;
  /**
   * validates a value and returns it
   * the result can be additionally be coerced
   * @param v the value to be parsed
   * @throws Validation<T> if validation of v fails
   */
  parse: (v: unknown, options?: ParsingOptions & ValidationOptions) => T;
  /**
   * returns the Meta Object
   */
  meta: () => M;
}

/**
 * A helper function to create a schema from a validation function.
 * @param validate the validation method
 * @returns the schema
 */
export function makeSchema<T, M>(
  validate: Schema<T, M>["validate"],
  meta: () => M
): Schema<T, M> {
  return {
    accepts: (v): v is T => isSuccess(validate(v, { earlyExit: true })),
    parse: (v, o) => {
      const validation = validate(v, o);
      if (isFailure(validation)) {
        throw validation;
      }
      return v as T;
    },
    validate,
    meta,
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
export function refine<T, M>(
  schema: Schema<T, M>,
  validate: (v: T, o: ValidationOptions) => ValidationResult<T> | void
): Schema<T, M> {
  return makeSchema((v, o) => {
    const validation = schema.validate(v, o);
    if (isFailure(validation)) {
      return validation;
    }
    return validate(v as T, o ?? defaultOptions) || undefined;
  }, schema.meta);
}

export function withMetaInformation<T, M, N>(
  schema: Schema<T, M>,
  metaExtension: N
) {
  return makeSchema(schema.validate, () => ({
    ...schema.meta(),
    ...metaExtension,
  }));
}

export function refineWithMetainformation<T, M, N>(
  schema: Schema<T, M>,
  validate: (v: T, o: ValidationOptions) => ValidationResult<T> | void,
  metaExtension: N
): Schema<T, Omit<M, keyof N> & N> {
  return makeSchema(
    (v, o) => {
      const validation = schema.validate(v, o);
      if (isFailure(validation)) {
        return validation;
      }
      return validate(v as T, o ?? defaultOptions) || undefined;
    },
    () => ({ ...schema.meta(), ...metaExtension })
  );
}

/**
 * Preprocesses data before parsing (aka coercion).
 *
 * For example
 * ```
 * coerce(number(), Number)
 * ```
 * will result in a schema that will accept numbers,
 * string, boolean etc... through native js coercion.
 * It will not accept ['a'] however, because that will coerce
 * into NaN which is not acceptable for number().
 *
 * This method is especially useful for parsing Timestamps
 * into date, number or string schemas. Using coercion, you can
 * avoid DTO objects and manual transformations in simple
 * use-cases. The more demanding use-cases might justify
 * @see conversion-graph.ts
 *
 * @param schema the base schema to coerce values into
 * @param coercion the coercion function
 * @returns the coerced schema
 */
export function coerce<T, M>(
  schema: Schema<T, M>,
  coercion: (v: unknown) => unknown
): Schema<T, M> {
  return {
    accepts: (v): v is T => schema.accepts(coercion(v)),
    parse: (v, o) => schema.parse(coercion(v), o),
    validate: (v, o) => schema.validate(coercion(v), o),
    meta: () => schema.meta(),
  };
}

/**
 * Transforms the parse result with an arbitrary transformation.
 *
 * Use this function with caution and prefer @see narrow():
 * ```
 * const boxedNumber = object({ v: number() })
 * const unboxedNumber = transform(boxedNumber, ({ v }) => v);
 * ```
 * `unboxedNumber` is of type Schema<S, M> but it will only accept values
 * that conform to `boxedNumber`. You can of course fix that with
 * ```
 * const fixedSchema = or(unboxedNumber, number())
 * ```
 * or perhaps you want to @see conversion-graph.ts
 *
 * @param schema the source schema
 * @param transformation the transformation function
 * @returns a schema that parses T into S and accepts T as S
 */
export function transform<T, S, M>(
  schema: Schema<T, M>,
  transformation: (v: T) => S
): Schema<S, M> {
  return {
    accepts: (v): v is S => schema.accepts(v),
    parse: (v, o) => transformation(schema.parse(v, o)),
    validate: (v, o) => schema.validate(v, o) as ValidationResult<S>,
    meta: () => schema.meta(),
  };
}

/**
 * Narrows the type using a projection function.
 *
 * This is a general case of @see defaultValue().
 *
 * @param schema the source schema
 * @param projection the projection function
 * @returns a schema that parses T into S and accepts T as S
 */
export function narrow<T, S extends T, M>(
  schema: Schema<T, M>,
  projection: (v: T) => S
): Schema<S, M> {
  return transform(schema, projection);
}

/**
 * Tries to parse a source value as JSON into the schema or
 * fail otherwhise (resulting in undefined)
 * @param schema the base schema to coerce values into
 * @returns the coerced schema
 */
export function json<T, M>(schema: Schema<T, M>): Schema<T, M> {
  return coerce(schema, (v) =>
    typeof v === "string" ? JSON.parse(v) : undefined
  );
}

/**
 * Infers the result type of a Schema<T, M> to T
 */
export type InferType<T> = T extends Schema<infer U, unknown> ? U : never;
/**
 * Infers the result type of a tuple of Schemas. E.g. [Schema<A, M>, Schema<B, N>] to [A, B]
 */
export type InferTypes<T extends [...unknown[]]> = T extends [
  infer Head,
  ...infer Tail
]
  ? [InferType<Head>, ...InferTypes<Tail>]
  : [];

/**
 * Infers the meta type of a Schema<T, M> to M
 */
export type InferMetaType<T> = T extends Schema<unknown, infer U> ? U : never;
