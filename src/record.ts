import { getOption, Schema } from "./schema";
import { isFailure, isSuccess, makeError, Validation } from "./validation";

export function record<T, M>(
  schema: Schema<T, M>
): Schema<{ [key: string]: T }, { type: "record"; schema: Schema<T, M> }> {
  type ResultT = { [key: string]: T };
  const validate: Schema<ResultT, unknown>["validate"] = (v, o) => {
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
  };
  return {
    accepts: (v, o): v is ResultT => isSuccess(validate(v, o)),
    validate,
    parse: (v, o) => {
      if (!getOption(o, "skipValidation")) {
        const validation = validate(v, o);
        if (isFailure(validation)) {
          throw validation;
        }
      }
      const result: Partial<ResultT> = {};
      for (const [key, value] of Object.entries(v as ResultT)) {
        result[key] = schema.parse(value, { ...o, skipValidation: true });
      }
      return result as ResultT;
    },
    meta: () => ({ type: "record", schema }),
  };
}
