import {
  isFailure,
  isSuccess,
  makeIssue,
  mergeValidations,
  simplifyValidation,
  ValidationIssue,
  ValidationResult,
} from "./validation";

export interface ValidationOptions {
  /**
   * Stop validation on the first issue.
   * default: false
   */
  earlyExit: boolean;
}
export interface ParsingOptions {
  /**
   * Parse in strip mode:
   *  - Objects will not contain additional properties
   * default: true
   */
  strip: boolean;
  /**
   * Do not validate the object before parsing.
   * Note that some validation may still be needed to parse the value.
   * default: false
   */
  skipValidation: boolean;
}

export type Options = ParsingOptions & ValidationOptions;
export const defaultOptions: Options = {
  earlyExit: false,
  strip: true,
  skipValidation: false,
};

export const getOption = (
  o: Partial<Options> | undefined,
  key: keyof Options
) => o?.[key] ?? defaultOptions[key];

/**
 * Result of a parse
 */
export interface ParseResult<I, O> {
  parsedValue?: O;
  validation?: ValidationResult<I>;
}

/**
 * A Schema that can be used to typeguard and validate type I
 * and parse values into type O.
 * It also has a metadata type M that allows introspection.
 *
 * @param I the type this schema validates against
 * @param O the type this schema parses into
 * @param M the type containing meta information
 */
export interface Schema<I, O, M> {
  /**
   * a typeguard of type I
   * this method is constructed by the makeSchema function
   * @param v the value to be checked
   * @returns boolean indicating if v is I
   */
  accepts: (v: unknown, options?: Partial<ValidationOptions>) => v is I;
  /**
   * builds a validation object containing all validation errors of the object
   * @param v the value to be checked
   * @returns the validation result
   */
  validate: (
    v: unknown,
    options?: Partial<ValidationOptions>
  ) => ValidationResult<I>;
  /**
   * parses a value as type O after validating it as type I
   * @param v the value to be parsed
   * @returns the parse result
   */
  parse: (v: unknown, options?: Partial<Options>) => ParseResult<I, O>;
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
export function makeSchema<I, O, M>(
  validate: Schema<I, O, M>["validate"],
  meta: () => M,
  parseAfterValidation: (v: I, options?: Partial<Options>) => O = (v) =>
    v as unknown as O
): Schema<I, O, M> {
  return {
    accepts: (v, o): v is I =>
      isSuccess(validate(v, { ...o, earlyExit: true })),
    parse: (v, o) => {
      if (!getOption(o, "skipValidation")) {
        const validation = validate(v, o);
        if (isFailure(validation)) {
          return { validation };
        }
      }
      return {
        parsedValue: parseAfterValidation(v as I, {
          ...o,
          skipValidation: true,
        }),
      };
    },
    validate,
    meta,
  };
}

export interface RefineContext<O> {
  add: (v: ValidationResult<Partial<O>>) => void;
  validIf(
    condition: boolean,
    message: string,
    ...args: unknown[]
  ): ValidationIssue | undefined;
  options: ValidationOptions;
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
 *   if (id > name.length) {
 *     return {
 *       name: makeIssue("id too high!!", v)
 *     };
 *   }
 * });
 * ```
 * will validate the id and write it as a validation
 * error of the name.
 *
 * A context object is passed into the validate function that
 * contains the current ValidationOptions and a builder
 * function to add validations. The refine method uses
 * `mergeValidations` to return a combined validation object.
 *
 * You can even construct a  validation result that may contain
 * successful validations and return it like this
 *
 * ```
 * const refined = refine(userSchema, ({id}, {invalidIf}) => ({
 *   id: id < name.length ? makeIssue("invalid_value", v, "idTooShort") : undefined,
 *   name: issueIf(id > name.length, "id too high!!"),
 * });
 * ```
 *
 * The refine method uses `simplifyValidation` to strip all successful
 * validations.
 *
 * @param schema the base schema
 * @param validate the additional validation function
 * @returns the refined schema
 */
export function refine<I, O, M, P extends I = I>(
  schema: Schema<I, O, M>,
  validate: (v: I, ctx: RefineContext<P>) => void | ValidationResult<P>
): Schema<P, O, M> {
  return refineWithMetainformation(schema, validate, schema.meta);
}

/**
 * Modify a schema by extending its meta informations.
 *
 * @param schema the base schema
 * @param metaExtension the additional meta fields
 * @returns the modified schema
 */
export function withMetaInformation<T, O, M, N>(
  schema: Schema<T, O, M>,
  metaExtension: N
) {
  return makeSchema(schema.validate, () => ({
    ...schema.meta(),
    ...metaExtension,
  }));
}

export function validIf<I, O, M>(
  schema: Schema<I, O, M>,
  valid: (v: I) => boolean,
  message: string,
  ...args: unknown[]
) {
  return makeSchema(
    (v, o) => {
      const validation = schema.validate(v, o);
      if (isFailure(validation)) {
        return validation;
      }
      if (!valid(v as I)) {
        return makeIssue("generic", message, v, ...args) as ValidationResult<I>;
      }
    },
    schema.meta,
    (v, o) => schema.parse(v, o)
  );
}

/**
 * Like refine but also extends the meta information.
 *
 * @param schema the base schema
 * @param validate the additional validation function
 * @param metaExtension the additional meta fields
 * @returns the modified schema
 */
export function refineWithMetainformation<I, O, M, N, P extends I = I>(
  schema: Schema<I, O, M>,
  validate: (v: I, ctx: RefineContext<P>) => void | ValidationResult<P>,
  metaExtension: N
): Schema<
  P,
  O,
  {
    [P in Exclude<keyof M, keyof N>]: M[P];
  } & N
> {
  return makeSchema(
    (v, o) => {
      let validation = schema.validate(v, o);
      if (isFailure(validation)) {
        return validation as ValidationResult<P>;
      }
      const refinedValidation = validate(v as I, {
        add: (val) => {
          validation = mergeValidations(validation, val);
        },
        validIf: (condition, message, ...args) =>
          condition ? undefined : makeIssue("generic", message, v, ...args),
        options: { ...defaultOptions, ...o },
      });
      return simplifyValidation(refinedValidation ?? validation);
    },
    () => ({ ...schema.meta(), ...metaExtension }),
    (v, o) => schema.parse(v, o).parsedValue as O
  );
}

/**
 * Preprocesses data before parsing or validation (aka coercion).
 *
 * Note that coercion done for accepting!
 *
 * For example
 * ```
 * coerce(number(), Number)
 * ```
 * will result in a schema that will validate numbers,
 * string, boolean etc... through native js coercion. It will
 * still act as a typeguard for numbers only.
 *
 * This method is especially useful for parsing Timestamps
 * into date, number or string schemas. @see coercedDate.
 * Using coercion, you can avoid DTO objects and manual
 * transformations in simple use-cases. The more demanding
 * use-cases might justify @see conversion-graph.ts
 *
 * @param schema the base schema to coerce values into
 * @param coercion the coercion function
 * @returns the coerced schema
 */
export function coerce<I, O, M>(
  schema: Schema<I, O, M>,
  coercion: (v: unknown) => unknown
): Schema<I, O, M> {
  return {
    accepts: (v): v is I => schema.accepts(v),
    parse: (v, o) => schema.parse(coercion(v), o),
    validate: (v, o) => schema.validate(coercion(v), o),
    meta: () => schema.meta(),
  };
}

/**
 * Transforms the parsed value using a general function.
 *
 * @param schema the source schema
 * @param transform the transform function
 * @returns the transformed schema
 */
export function transform<I, O, P, M>(
  schema: Schema<I, O, M>,
  transform: (v: O) => P
): Schema<I, P, M> {
  return {
    accepts: (v): v is I => schema.accepts(v),
    parse: (v, o) => {
      const result = schema.parse(v, o);
      return {
        ...result,
        parsedValue: isSuccess(result.validation)
          ? transform(result.parsedValue as O)
          : undefined,
      };
    },
    validate: (v, o) => schema.validate(v, o),
    meta: () => schema.meta(),
  };
}
/**
 * Narrows the type of the parsed value using a projection function.
 *
 * This is a general case of @see defaultValue() and a special case of @see transform
 *
 * @param schema the source schema
 * @param projection the projection function
 * @returns the narrowed schema
 */
export function narrow<I, O, P extends O, M>(
  schema: Schema<I, O, M>,
  projection: (v: O) => P
): Schema<I, P, M> {
  return transform(schema, projection);
}

/**
 * Set option overrides for a schema.
 *
 * @param schema the nested schema
 * @param options the options
 * @returns the modified schema
 */
export function options<I, O, M>(
  schema: Schema<I, O, M>,
  options: Partial<Options>
): Schema<I, O, M> {
  return {
    accepts: (v): v is I => schema.accepts(v),
    parse: (v, o) => schema.parse(v, { ...o, ...options }),
    validate: (v, o) => schema.validate(v, { ...o, ...options }),
    meta: () => schema.meta(),
  };
}

/**
 * Tries to parse a source value as JSON into the schema or
 * fail otherwhise (resulting in undefined)
 * @param schema the base schema to coerce values into
 * @returns the coerced schema
 */
export function json<I, O, M>(schema: Schema<I, O, M>): Schema<I, O, M> {
  return coerce(schema, (v) =>
    typeof v === "string" ? JSON.parse(v) : undefined
  );
}

/**
 * Infers the result type of a Schema<T, M> to T
 */
export type InferType<T> = T extends Schema<infer U, unknown, unknown>
  ? U
  : never;
export type InferOutputType<T> = T extends Schema<unknown, infer U, unknown>
  ? U
  : never;

/**
 * Infers the meta type of a Schema<T, M> to M
 */
export type InferMetaType<T> = T extends Schema<unknown, unknown, infer U>
  ? U
  : never;

/**
 * Infers the result type of a tuple of Schemas. E.g. [Schema<A, M>, Schema<B, N>] to [A, B]
 */
export type InferTypes<T extends readonly unknown[]> = T extends [
  infer Head,
  ...infer Tail
]
  ? [InferType<Head>, ...InferTypes<Tail>]
  : [];
export type InferOutputTypes<T extends readonly unknown[]> = T extends [
  infer Head,
  ...infer Tail
]
  ? [InferOutputType<Head>, ...InferOutputTypes<Tail>]
  : [];
