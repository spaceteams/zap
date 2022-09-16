import { Unionize } from "./or";
import { InferTypes, makeSchema, Schema } from "./schema";
import { isSuccess, makeError, ValidationResult } from "./validation";

export function xor<T extends Schema<unknown, unknown>[]>(
  ...schemas: T
): Schema<Unionize<InferTypes<T>>, { type: "xor"; schemas: T }> {
  type V = ValidationResult<Unionize<InferTypes<T>>>;
  return makeSchema(
    (v, o) => {
      let result: ValidationResult<unknown>;
      let hasSuccess = false;
      for (const schema of schemas) {
        result = schema.validate(v, o);
        if (isSuccess(result)) {
          if (hasSuccess) {
            return makeError("invalid_value", v, "xor") as V;
          } else {
            hasSuccess = true;
          }
        }
      }
      if (!hasSuccess) {
        return result as V;
      }
    },
    () => ({ type: "xor", schemas })
  );
}
