import {
  defaultOptions,
  makeSchema,
  Schema,
  ValidationOptions,
} from "./schema";
import {
  isFailure,
  isValidationIssue,
  mergeValidations,
  simplifyValidation,
  ValidationIssue,
  ValidationResult,
} from "./validation";

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

/**
 * The async variant to refine.
 *
 * @param schema the base schema
 * @param validate the additional validation function
 * @returns the refined schema
 */
export function refineAsync<I, O, M, P extends I = I>(
  schema: Schema<I, O, M>,
  validateAsync: (
    v: I,
    ctx: RefineContext<P>
  ) => Promise<ValidationResult<P> | void>
): Schema<P, O, M> {
  return refineAsyncWithMetainformation(schema, validateAsync, schema.meta);
}

/**
 * This function allows for even more succinct refinements
 * than refine. You can just write
 * ```
 * validIf(number(), v % 2 === 0, "must be even")
 * ```
 * At the cost of the full validation API.
 *
 * @param schema the base schema
 * @param valid the additional validation function
 * @param message the message of the generic issue
 * @param args arguments of the issue
 * @returns the modified schema
 */
export function validIf<I, O, M>(
  schema: Schema<I, O, M>,
  valid: (v: I) => boolean,
  message: string,
  ...args: unknown[]
) {
  return refine(
    schema,
    (v, { validIf }) =>
      validIf(valid(v), message, ...args) as ValidationResult<I>
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
    let refinedValidation: ValidationResult<P>;
    try {
      refinedValidation =
        validate(v as I, {
          add: (val) => {
            validation = mergeValidations(validation, val);
          },
          validIf: (condition, message, ...args) =>
            condition
              ? undefined
              : new ValidationIssue("generic", message, v, ...args),
          options: { ...defaultOptions, ...o },
        }) ?? undefined;
    } catch (error: unknown) {
      if (isValidationIssue(error)) {
        refinedValidation = error as ValidationResult<P>;
      } else {
        throw error;
      }
    }
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

/**
 * Like refineAsync but also extends the meta information.
 *
 * @param schema the base schema
 * @param validateAsync the additional validation function
 * @param metaExtension the additional meta fields
 * @returns the modified schema
 */
export function refineAsyncWithMetainformation<I, O, M, N, P extends I = I>(
  schema: Schema<I, O, M>,
  validateAsync: (
    v: I,
    ctx: RefineContext<P>
  ) => Promise<ValidationResult<P> | void>,
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
      let refinedValidation: ValidationResult<P>;
      try {
        refinedValidation =
          (await validateAsync(v as I, {
            add: (val) => {
              validation = mergeValidations(validation, val);
            },
            validIf: (condition, message, ...args) =>
              condition
                ? undefined
                : new ValidationIssue("generic", message, v, ...args),
            options: { ...defaultOptions, ...o },
          })) ?? undefined;
      } catch (error: unknown) {
        if (isValidationIssue(error)) {
          refinedValidation = error as ValidationResult<P>;
        } else {
          throw error;
        }
      }
      return simplifyValidation(refinedValidation ?? validation);
    },
    () => ({ ...schema.meta(), ...metaExtension }),
    (v, o) => schema.parse(v, o).parsedValue as O
  );
}
