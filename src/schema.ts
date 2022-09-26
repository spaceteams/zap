import {
  isFailure,
  isSuccess,
  makeIssue,
  mergeValidations,
  simplifyValidation,
  ValidationIssue,
  ValidationIssueCode,
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
 * A Schema of type T that can be used to typeguard, validate and parse values.
 * It also has a metadata type M that allows introspection.
 */
export interface Schema<T, M> {
  /**
   * a typeguard of type T
   * this method is constructed by the makeSchema function
   * @param v the value to be checked
   */
  accepts: (v: unknown, options?: Partial<ValidationOptions>) => v is T;
  /**
   * builds a validation object containing all validation errors of the object
   * @param v the value to be checked
   */
  validate: (
    v: unknown,
    options?: Partial<ValidationOptions>
  ) => ValidationResult<T>;
  /**
   * parses a value after validating it
   * @param v the value to be parsed
   * @throws Validation<T> if validation of v fails
   */
  parse: (v: unknown, options?: Partial<Options>) => T;
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
  meta: () => M,
  parseAfterValidation: (v: T, options?: Partial<Options>) => T = (v) => v
): Schema<T, M> {
  return {
    accepts: (v, o): v is T =>
      isSuccess(validate(v, { ...o, earlyExit: true })),
    parse: (v, o) => {
      if (!getOption(o, "skipValidation")) {
        const validation = validate(v, o);
        if (isFailure(validation)) {
          throw validation;
        }
      }
      return parseAfterValidation(v as T, { ...o, skipValidation: true });
    },
    validate,
    meta,
  };
}

export interface SafeParseResult<T, In = unknown> {
  originalValue: In;
  parsedValue: T | undefined;
  validation: ValidationResult<T>;
  parsingError: Error | undefined;
}

/**
 * Parses a value with all effects catched into a result structure.
 * @param schema the schema
 * @param v the value to be parsed
 * @param options the options used for parsing
 * @returns the result object
 */
export function safeParse<T, M, In = unknown>(
  schema: Schema<T, M>,
  v: In,
  options: Partial<Options> = {}
): SafeParseResult<T, In> {
  const result = {
    originalValue: v,
    validation: undefined,
    parsedValue: undefined,
    parsingError: undefined,
  };
  try {
    return {
      ...result,
      parsedValue: schema.parse(v, options),
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        ...result,
        parsingError: error,
      };
    }
    return {
      ...result,
      validation: error as ValidationResult<T>,
    };
  }
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
export function refine<T, M>(
  schema: Schema<T, M>,
  validate: (
    v: T,
    ctx: {
      add: (v: ValidationResult<Partial<T>>) => void;
      issueIf(
        condition: boolean,
        message: ValidationIssueCode | string,
        ...args: unknown[]
      ): ValidationIssue | undefined;
      options: ValidationOptions;
    }
  ) => void | ValidationResult<T>
): Schema<T, M> {
  return refineWithMetainformation(schema, validate, schema.meta);
}

/**
 * Modify a schema by extending its meta informations.
 *
 * @param schema the base schema
 * @param metaExtension the additional meta fields
 * @returns the modified schema
 */
export function withMetaInformation<T, M, N>(
  schema: Schema<T, M>,
  metaExtension: N
) {
  return makeSchema(schema.validate, () => ({
    ...schema.meta(),
    ...metaExtension,
  }));
}

/**
 * Like refine but also extends the meta information.
 *
 * @param schema the base schema
 * @param validate the additional validation function
 * @param metaExtension the additional meta fields
 * @returns the modified schema
 */
export function refineWithMetainformation<T, M, N>(
  schema: Schema<T, M>,
  validate: (
    v: T,
    ctx: {
      add: (v: ValidationResult<Partial<T>>) => void;
      issueIf(
        condition: boolean,
        message: ValidationIssueCode | string,
        ...args: unknown[]
      ): ValidationIssue | undefined;
      options: ValidationOptions;
    }
  ) => void | ValidationResult<T>,
  metaExtension: N
): Schema<T, Omit<M, keyof N> & N> {
  return makeSchema(
    (v, o) => {
      let validation = schema.validate(v, o);
      if (isFailure(validation)) {
        return validation;
      }
      const refinedValidation = validate(v as T, {
        add: (val) => {
          validation = mergeValidations(validation, val);
        },
        issueIf: (condition, message, ...args) =>
          condition ? makeIssue(message, v, ...args) : undefined,
        options: { ...defaultOptions, ...o },
      });
      return simplifyValidation(refinedValidation ?? validation);
    },
    () => ({ ...schema.meta(), ...metaExtension })
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
export function coerce<T, M>(
  schema: Schema<T, M>,
  coercion: (v: unknown) => unknown
): Schema<T, M> {
  return {
    accepts: (v): v is T => schema.accepts(v),
    parse: (v, o) => schema.parse(coercion(v), o),
    validate: (v, o) => schema.validate(coercion(v), o),
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
  return {
    accepts: (v): v is S => schema.accepts(v),
    parse: (v, o) => projection(schema.parse(v, o)),
    validate: (v, o) => schema.validate(v, o) as ValidationResult<S>,
    meta: () => schema.meta(),
  };
}

/**
 * Set option overrides for a schema.
 *
 * @param schema the nested schema
 * @param options the options
 * @returns the modified schema
 */
export function options<T, M>(
  schema: Schema<T, M>,
  options: Partial<Options>
): Schema<T, M> {
  return {
    accepts: (v): v is T => schema.accepts(v),
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
