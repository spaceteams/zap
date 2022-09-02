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
export function transform<S, T>(
  schema: Schema<S>,
  transformValue: (v: S) => T
): Schema<S, T> {
  return {
    accepts: (v): v is S => schema.accepts(v),
    parse: (v) => transformValue(schema.parse(v)),
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
