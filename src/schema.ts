export type Validation<T> = T extends { [key: string]: unknown }
  ?
      | {
          [P in keyof T]?: Validation<T[P]>;
        }
      | string
  : T extends unknown[]
  ? Validation<T[number]>[] | string
  : string;

export function validate(
  valid: boolean,
  message: string,
  onValid?: string
): string | undefined {
  return valid ? onValid : message;
}

export function isSuccess<T>(validation: Validation<T> | undefined): boolean {
  return validation === undefined;
}
export function isFailure<T>(
  validation: Validation<T> | undefined
): validation is Validation<T> {
  return validation !== undefined;
}

export interface Schema<T, V = T> {
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
  validate: (v: unknown) => Validation<T> | undefined;
  /**
   * validates a value and returns it
   * the type of the parsed result can be additionally transformed into another type V
   * @param v the value to be parsed
   * @throws Validation<T> if validation of v fails
   */
  parse: (v: unknown) => V;
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
  validate: (v: T) => Validation<T> | undefined
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

export type InferSchemaValue<T> = T extends Schema<unknown, infer U>
  ? U
  : never;
export type InferSchemaValues<T extends [...unknown[]]> = T extends [
  infer Head,
  ...infer Tail
]
  ? [InferSchemaValue<Head>, ...InferSchemaValues<Tail>]
  : [];

export type InferSchemaSource<T> = T extends Schema<infer U, unknown>
  ? U
  : never;
export type InferSchemaSources<T extends [...unknown[]]> = T extends [
  infer Head,
  ...infer Tail
]
  ? [InferSchemaSource<Head>, ...InferSchemaSources<Tail>]
  : [];
