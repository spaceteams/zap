import {
  getOption,
  InferOutputTypes,
  InferTypes,
  makeSchema,
  Schema,
} from "../schema";
import { Intersect } from "../utility";
import { isFailure, mergeValidations, ValidationResult } from "../validation";

export function and<T extends readonly Schema<unknown>[]>(
  ...schemas: T
): Schema<
  Intersect<InferTypes<T>>,
  Intersect<InferOutputTypes<T>>,
  { type: "and"; schemas: T }
> {
  type ResultI = Intersect<InferTypes<T>>;
  type ResultO = Intersect<InferOutputTypes<T>>;

  class Aggregator {
    constructor(readonly earlyExit: boolean) {}

    public result: ValidationResult<ResultI>;

    onValidate(validation: ValidationResult<unknown>): boolean {
      this.result = mergeValidations(this.result, validation);
      return this.earlyExit && isFailure(validation);
    }
  }

  return makeSchema(
    (v, o) => {
      const aggregator = new Aggregator(getOption(o, "earlyExit"));
      for (const schema of schemas) {
        const validation = schema.validate(v, o);
        if (aggregator.onValidate(validation)) {
          break;
        }
      }
      return aggregator.result;
    },
    async (v, o) => {
      const aggregator = new Aggregator(getOption(o, "earlyExit"));
      for (const schema of schemas) {
        const validation = await schema.validateAsync(v, o);
        if (aggregator.onValidate(validation)) {
          break;
        }
      }
      return aggregator.result;
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
