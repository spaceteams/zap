export type Validation<T> = T extends { [key: string]: unknown }
  ?
      | {
          [P in keyof T]?: Validation<T[P]>;
        }
      | string
  : T extends unknown[]
  ? Validation<T[number]>[] | string
  : string;

export function isSuccess<T>(validation: Validation<T> | undefined): boolean {
  return validation === undefined;
}
export function isFailure<T>(
  validation: Validation<T> | undefined
): validation is Validation<T> {
  return validation !== undefined;
}

export interface Schema<T> {
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
}

export function makeSchema<T>(validate: Schema<T>["validate"]): Schema<T> {
  return {
    accepts: (v): v is T => isSuccess(validate(v)),
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

export type InferType<T> = T extends Schema<infer U> ? U : never;
export type InferTypes<T extends [...unknown[]]> = T extends [
  infer Head,
  ...infer Tail
]
  ? [InferType<Head>, ...InferTypes<Tail>]
  : [];
