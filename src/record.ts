import { getOption, makeSchema, Schema } from "./schema";
import { isFailure, makeError, Validation } from "./validation";

export function record<T, M>(
  schema: Schema<T, M>
): Schema<{ [key: string]: T }, { type: "record"; schema: Schema<T, M> }> {
  type ResultT = { [key: string]: T };
  return makeSchema(
    (v, o) => {
      if (typeof v !== "object") {
        return makeError("wrong_type", v, "object");
      }
      if (v === null) {
        return makeError("wrong_type", v, "null");
      }
      const validation: Validation<{ [key: string]: T }> = {};
      for (const [key, value] of Object.entries(v)) {
        const innerValidation = schema.validate(value, o);
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
    () => ({ type: "record", schema }),
    (v, o) => {
      const result: Partial<ResultT> = {};
      for (const [key, value] of Object.entries(v as ResultT)) {
        result[key] = schema.parse(value, o);
      }
      return result as ResultT;
    }
  );
}
