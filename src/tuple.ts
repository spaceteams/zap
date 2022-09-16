import { InferTypes, getOption, makeSchema, Schema } from "./schema";
import {
  isFailure,
  isSuccess,
  makeError,
  Validation,
  ValidationResult,
} from "./validation";

export function tuple<T extends Schema<unknown, unknown>[]>(
  ...schemas: T
): Schema<InferTypes<T>, { type: "tuple"; schemas: T }> {
  type ResultT = InferTypes<T>;
  type V = Validation<ResultT>;
  const validate: Schema<ResultT, unknown>["validate"] = (v, o) => {
    if (!Array.isArray(v)) {
      return makeError("wrong_type", v, "array") as V;
    }
    if (schemas.length !== v.length) {
      return makeError("invalid_value", v, "length", schemas.length) as V;
    }

    const validations = [] as ValidationResult<unknown>[];
    let i = 0;
    for (const value of v) {
      const validation = schemas[i].validate(value, o);
      validations.push(validation);
      if (getOption(o, "earlyExit") && isFailure(validation)) {
        return validations as V;
      }
      i++;
    }
    if (validations.every((v) => isSuccess(v))) {
      return;
    }
    return validations as V;
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
      const result: unknown[] = [];
      let i = 0;
      for (const value of v as ResultT) {
        result.push(schemas[i].parse(value, { ...o, skipValidation: true }));
        i++;
      }
      return result as ResultT;
    },
    meta: () => ({ type: "tuple", schemas }),
  };
}
