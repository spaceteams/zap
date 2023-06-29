import {
  InferOutputTypes,
  InferTypes,
  ParseResult,
  Schema,
  ValidationOptions,
} from "../schema";
import { Unionize } from "../utility";
import { ValidationResult, isFailure, isSuccess } from "../validation";

export function or<T extends Schema<unknown>[]>(
  ...schemas: T
): Schema<
  Unionize<InferTypes<T>>,
  Unionize<InferOutputTypes<T>>,
  { type: "or"; schemas: T }
> {
  type ResultI = Unionize<InferTypes<T>>;
  type ResultO = Unionize<InferOutputTypes<T>>;

  class Aggregator {
    constructor(readonly options: Partial<ValidationOptions> | undefined) {}

    public result: ValidationResult<ResultI>;
    public successSchema: Schema<unknown>;

    onValidate(
      validation: ValidationResult<unknown>,
      schema: Schema<unknown>
    ): boolean {
      this.result = validation as ValidationResult<ResultI>;
      if (isFailure(validation)) {
        return false;
      }
      this.successSchema = schema;
      return true;
    }

    parseResult(v: unknown): ParseResult<ResultI, ResultO> {
      if (this.successSchema === undefined) {
        return { validation: this.result } as ParseResult<ResultI, ResultO>;
      }
      return this.successSchema.parse(v, {
        ...this.options,
        skipValidation: true,
      }) as ParseResult<ResultI, ResultO>;
    }
  }

  const validate: Schema<ResultI, ResultO, unknown>["validate"] = (v, o) => {
    const aggregator = new Aggregator(o);
    for (const schema of schemas) {
      const validation = schema.validate(v, o);
      if (aggregator.onValidate(validation, schema)) {
        break;
      }
    }
    return aggregator.result;
  };
  const validateAsync: Schema<
    ResultI,
    ResultO,
    unknown
  >["validateAsync"] = async (v, o) => {
    const aggregator = new Aggregator(o);
    for (const schema of schemas) {
      const validation = await schema.validateAsync(v, o);
      if (aggregator.onValidate(validation, schema)) {
        break;
      }
    }
    return aggregator.result;
  };
  const parse: Schema<ResultI, ResultO, unknown>["parse"] = (v, o) => {
    const aggregator = new Aggregator(o);
    for (const schema of schemas) {
      const validation = schema.validate(v, o);
      if (aggregator.onValidate(validation, schema)) {
        break;
      }
    }
    return aggregator.parseResult(v);
  };
  const parseAsync: Schema<ResultI, ResultO, unknown>["parseAsync"] = async (
    v,
    o
  ) => {
    const aggregator = new Aggregator(o);
    for (const schema of schemas) {
      const validation = await schema.validateAsync(v, o);
      if (aggregator.onValidate(validation, schema)) {
        break;
      }
    }
    return aggregator.parseResult(v);
  };

  return {
    accepts: (v, o): v is Unionize<InferTypes<T>> => isSuccess(validate(v, o)),
    parse,
    parseAsync,
    validate,
    validateAsync,
    meta: () => ({ type: "or", schemas }),
  };
}
