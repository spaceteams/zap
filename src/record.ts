import { getOption, makeSchema, Schema } from "./schema";
import { isFailure, Validation } from "./validation";

export function record<T, M>(
  schema: Schema<T, M>
): Schema<{ [key: string]: T }, { type: "record"; schema: Schema<T, M> }> {
  return makeSchema(
    (v, o) => {
      if (typeof v !== "object") {
        return "value should be an object";
      }
      if (v === null) {
        return "value should not be null";
      }
      const validation: Validation<{ [key: string]: T }> = {};
      for (const [key, value] of Object.entries(v)) {
        const innerValidation = schema.validate(value);
        if (isFailure(innerValidation)) {
          validation[key] = innerValidation;
          if (getOption(o, "earlyExit")) {
            return validation;
          }
        }
      }
      if (Object.keys(validation).length === 0) {
        return;
      }
      return validation;
    },
    () => ({ type: "record", schema })
  );
}
