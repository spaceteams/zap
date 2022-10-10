import {
  getOption,
  InferTypes,
  InferOutputTypes,
  makeSchema,
  Schema,
} from "../schema";
import { Intersect } from "../utility";
import { isFailure, mergeValidations, ValidationResult } from "../validation";

export function and<T extends readonly Schema<unknown, unknown, unknown>[]>(
  ...schemas: T
): Schema<
  Intersect<InferTypes<T>>,
  Intersect<InferOutputTypes<T>>,
  { type: "and"; schemas: T }
> {
  type ResultI = Intersect<InferTypes<T>>;
  type ResultO = Intersect<InferOutputTypes<T>>;
  return makeSchema(
    (v, o) => {
      let result: ValidationResult<unknown>;
      for (const schema of schemas) {
        result = mergeValidations(result, schema.validate(v, o));
        if (isFailure(result) && getOption(o, "earlyExit")) {
          break;
        }
      }
      return result as ValidationResult<ResultI>;
    },
    () => ({ type: "and", schemas }),
    (v, o) => {
      const results: Partial<ResultO>[] = [];
      for (const schema of schemas) {
        results.push(schema.parse(v, o).parsedValue as ResultO);
      }
      return Object.assign({}, ...results) as ResultO;
    }
  );
}
