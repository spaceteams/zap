import {
  getOption,
  InferTypes,
  InferOutputTypes,
  makeSchema,
  Schema,
  ValidationOptions,
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
    constructor(readonly options: Partial<ValidationOptions> | undefined) {}

    public result: ValidationResult<ResultI> = undefined;

    onValidate(validation: ValidationResult<unknown>): boolean {
      this.result = mergeValidations(this.result, validation);
      return getOption(this.options, "earlyExit") && isFailure(validation);
    }
  }

  return makeSchema(
    (v, o) => {
      const aggregator = new Aggregator(o);
      for (const schema of schemas) {
        const validation = schema.validate(v, o);
        if (aggregator.onValidate(validation)) {
          break;
        }
      }
      return aggregator.result;
    },
    async (v, o) => {
      const aggregator = new Aggregator(o);
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
