import { InferTypes, makeSchema, Schema } from "./schema";
import { isSuccess, ValidationResult } from "./validation";

type Unionize<T extends [...unknown[]]> = T extends [infer Head, ...infer Tail]
  ? Head | Unionize<Tail>
  : never;

export function or<T extends Schema<unknown, unknown>[]>(
  ...schemas: T
): Schema<Unionize<InferTypes<T>>, { type: "or"; schemas: T }> {
  return makeSchema(
    (v) => {
      let result: ValidationResult<unknown>;
      for (const schema of schemas) {
        result = schema.validate(v);
        if (isSuccess(schema.validate(v))) {
          break;
        }
      }
      return result as ValidationResult<Unionize<InferTypes<T>>>;
    },
    () => ({ type: "or", schemas })
  );
}
