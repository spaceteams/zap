import { getOption, InferTypes, makeSchema, Schema } from "../schema";
import { Intersect } from "../utility";
import { isFailure, mergeValidations, ValidationResult } from "../validation";

export function and<T extends readonly Schema<unknown, unknown>[]>(
  ...schemas: T
): Schema<Intersect<InferTypes<T>>, { type: "and"; schemas: T }> {
  type ResultT = Intersect<InferTypes<T>>;
  return makeSchema(
    (v, o) => {
      let result: ValidationResult<unknown>;
      for (const schema of schemas) {
        result = mergeValidations(result, schema.validate(v, o));
        if (isFailure(result) && getOption(o, "earlyExit")) {
          break;
        }
      }
      return result as ValidationResult<Intersect<InferTypes<T>>>;
    },
    () => ({ type: "and", schemas }),
    (v, o) => {
      const results: Partial<ResultT>[] = [];
      for (const schema of schemas) {
        results.push(schema.parse(v, o) as Partial<ResultT>);
      }
      return Object.assign({}, ...results) as ResultT;
    }
  );
}
