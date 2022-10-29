import {
  isFailure,
  isSuccess,
  ValidationIssue,
  mergeValidations,
  simplifyValidation,
  ValidationResult,
} from "./validation";

export interface ValidationOptions {
  /**
   * Stop validation on the first issue.
   * default: false
   */
  earlyExit: boolean;
  /**
   * Use coercion to validate this value. This option has no effect during parsing.
   * default: false
   */
  withCoercion: boolean;
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
  withCoercion: false,
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
export type ParseResult<I, O> = {
  parsedValue?: O;
  validation?: ValidationResult<I>;
};

/**
 * A Schema that can be used to typeguard and validate type I
 * and parse values into type O.
 * It also has a metadata type M that allows introspection.
 *
 * @param I the type this schema validates against
 * @param O the type this schema parses into
 * @param M the type containing meta information
 */
export interface Schema<I, O = I, M = { type: string }> {
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
  validateAsync: (
    v: unknown,
    options?: Partial<ValidationOptions>
  ) => Promise<ValidationResult<I>>;
  /**
   * parses a value as type O after validating it as type I
   * @param v the value to be parsed
   * @returns the parse result
   */
  parse: (v: unknown, options?: Partial<Options>) => ParseResult<I, O>;
  parseAsync: (
    v: unknown,
    options?: Partial<Options>
  ) => Promise<ParseResult<I, O>>;
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
  validateAsync: Schema<I, O, M>["validateAsync"],
  meta: () => M,
  parseAfterValidation: (v: I, options?: Partial<Options>) => O = (v) =>
    v as unknown as O
): Schema<I, O, M> {
  const parse: Schema<I, O, M>["parse"] = (v, o) => {
    if (!getOption(o, "skipValidation")) {
      const validation = validate(v, { ...o, withCoercion: true });
      if (isFailure(validation)) {
        return { validation };
      }
    }
    return {
      parsedValue: parseAfterValidation(v as I, {
        ...o,
        skipValidation: true,
        withCoercion: true,
      }),
    };
  };
  const parseAsync: Schema<I, O, M>["parseAsync"] = async (v, o) => {
    if (!getOption(o, "skipValidation")) {
      const validation = await validateAsync(v, { ...o, withCoercion: true });
      if (isFailure(validation)) {
        return { validation };
      }
    }
    return {
      parsedValue: parseAfterValidation(v as I, {
        ...o,
        skipValidation: true,
        withCoercion: true,
      }),
    };
  };
  return {
    accepts: (v, o): v is I =>
      isSuccess(validate(v, { ...o, earlyExit: true })),
    parse,
    parseAsync,
    validate,
    validateAsync,
    meta,
  };
}

export function makeSyncSchema<I, O, M>(
  validate: Schema<I, O, M>["validate"],
  meta: () => M,
  parseAfterValidation: (v: I, options?: Partial<Options>) => O = (v) =>
    v as unknown as O
): Schema<I, O, M> {
  const parse: Schema<I, O, M>["parse"] = (v, o) => {
    if (!getOption(o, "skipValidation")) {
      const validation = validate(v, { ...o, withCoercion: true });
      if (isFailure(validation)) {
        return { validation };
      }
    }
    return {
      parsedValue: parseAfterValidation(v as I, {
        ...o,
        skipValidation: true,
        withCoercion: true,
      }),
    };
  };
  return {
    accepts: (v, o): v is I =>
      isSuccess(validate(v, { ...o, earlyExit: true })),
    parse,
    parseAsync: (v, o) => Promise.resolve(parse(v, o)),
    validate,
    validateAsync: (v, o) => Promise.resolve(validate(v, o)),
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
 *       name: new ValidationIssue("id too high!!", v)
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
 *   id: id < name.length ? new ValidationIssue("invalid_value", v, "idTooShort") : undefined,
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
export function refineAsync<I, O, M, P extends I = I>(
  schema: Schema<I, O, M>,
  validateAsync: (
    v: I,
    ctx: RefineContext<P>
  ) => void | Promise<ValidationResult<P>>
): Schema<P, O, M> {
  return refineAsyncWithMetainformation(schema, validateAsync, schema.meta);
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
  return makeSchema(schema.validate, schema.validateAsync, () => ({
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
  const postValidation = (validation: ValidationResult<I>, v: unknown) => {
    if (isFailure(validation)) {
      return validation;
    }
    if (!valid(v as I)) {
      return new ValidationIssue(
        "generic",
        message,
        v,
        ...args
      ) as ValidationResult<I>;
    }
  };
  return makeSchema(
    (v, o) => {
      const validation = schema.validate(v, o);
      return postValidation(validation, v);
    },
    async (v, o) => {
      const validation = await schema.validateAsync(v, o);
      return postValidation(validation, v);
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
  const postValidation = (
    validation: ValidationResult<I>,
    v: unknown,
    o?: Partial<ValidationOptions>
  ) => {
    if (isFailure(validation)) {
      return validation as ValidationResult<P>;
    }
    const refinedValidation = validate(v as I, {
      add: (val) => {
        validation = mergeValidations(validation, val);
      },
      validIf: (condition, message, ...args) =>
        condition
          ? undefined
          : new ValidationIssue("generic", message, v, ...args),
      options: { ...defaultOptions, ...o },
    });
    return simplifyValidation(refinedValidation ?? validation);
  };

  return makeSchema(
    (v, o) => {
      const validation = schema.validate(v, o);
      return postValidation(validation, v, o);
    },
    async (v, o) => {
      const validation = await schema.validateAsync(v, o);
      return postValidation(validation, v, o);
    },
    () => ({ ...schema.meta(), ...metaExtension }),
    (v, o) => schema.parse(v, o).parsedValue as O
  );
}
export function refineAsyncWithMetainformation<I, O, M, N, P extends I = I>(
  schema: Schema<I, O, M>,
  validateAsync: (
    v: I,
    ctx: RefineContext<P>
  ) => void | Promise<ValidationResult<P>>,
  metaExtension: N
): Schema<
  P,
  O,
  {
    [P in Exclude<keyof M, keyof N>]: M[P];
  } & N
> {
  return makeSchema(
    (v) =>
      new ValidationIssue(
        "async_validation_required",
        undefined,
        v
      ) as ValidationResult<P>,
    async (v, o) => {
      let validation = await schema.validateAsync(v, o);
      if (isFailure(validation)) {
        return validation as ValidationResult<P>;
      }
      const refinedValidation = await validateAsync(v as I, {
        add: (val) => {
          validation = mergeValidations(validation, val);
        },
        validIf: (condition, message, ...args) =>
          condition
            ? undefined
            : new ValidationIssue("generic", message, v, ...args),
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
 * transformations in simple use-cases.
 *
 * @param schema the base schema to coerce values into
 * @param coercion the coercion function
 * @returns the coerced schema
 */
export function coerce<I, O, M>(
  schema: Schema<I, O, M>,
  coercion: (v: unknown) => unknown
): Schema<I, O, M> {
  const parse: Schema<I, O, M>["parse"] = (v, o) =>
    schema.parse(coercion(v), o);
  const validate: Schema<I, O, M>["validate"] = (v, o) =>
    schema.validate(getOption(o, "withCoercion") ? coercion(v) : v, o);
  return {
    accepts: (v): v is I => schema.accepts(v),
    parse,
    parseAsync: (v, o) => Promise.resolve(parse(v, o)),
    validate,
    validateAsync: (v, o) => Promise.resolve(validate(v, o)),
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
  const parse: Schema<I, P, M>["parse"] = (v, o) => {
    const result = schema.parse(v, o);
    return {
      ...result,
      parsedValue: isSuccess(result.validation)
        ? transform(result.parsedValue as O)
        : undefined,
    };
  };
  const validate: Schema<I, P, M>["validate"] = (v, o) => schema.validate(v, o);
  return {
    accepts: (v): v is I => schema.accepts(v),
    parse,
    parseAsync: (v, o) => Promise.resolve(parse(v, o)),
    validate,
    validateAsync: (v, o) => Promise.resolve(validate(v, o)),
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
  const parse: Schema<I, O, M>["parse"] = (v, o) =>
    schema.parse(v, { ...o, ...options });
  const validate: Schema<I, O, M>["validate"] = (v, o) =>
    schema.validate(v, { ...o, ...options });
  return {
    accepts: (v): v is I => schema.accepts(v),
    parse,
    parseAsync: (v, o) => Promise.resolve(parse(v, o)),
    validate,
    validateAsync: (v, o) => Promise.resolve(validate(v, o)),
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
