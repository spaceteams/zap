import {
  InferSchemaSources,
  isSuccess,
  makeSchema,
  Schema,
  Validation,
} from "./schema";

export function tuple<T extends Schema<unknown>[]>(
  ...schemas: T
): Schema<InferSchemaSources<T>> {
  return makeSchema((v) => {
    if (!Array.isArray(v)) {
      return "value should be an array" as Validation<InferSchemaSources<T>>;
    }
    if (schemas.length !== v.length) {
      return `value should have length ${schemas.length}` as Validation<
        InferSchemaSources<T>
      >;
    }
    const validations = v.map((value, i) => schemas[i].validate(value));
    if (validations.every((v) => isSuccess(v))) {
      return;
    }
    return validations as Validation<InferSchemaSources<T>>;
  });
}
