import {
  InferOutputTypes,
  InferTypes,
  ParseResult,
  Schema,
  ValidationOptions,
} from "../schema";
import { isSuccess, ValidationResult } from "../validation";
import { Unionize } from "../utility";

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

    public result: ValidationResult<ResultI> = undefined;

    onValidate(validation: ValidationResult<unknown>): boolean {
      this.result = validation as ValidationResult<ResultI>;
      return isSuccess(validation);
    }
  }

  const validate: Schema<ResultI, ResultO, unknown>["validate"] = (v, o) => {
    const aggregator = new Aggregator(o);
    for (const schema of schemas) {
      const validation = schema.validate(v, o);
      if (aggregator.onValidate(validation)) {
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
      if (aggregator.onValidate(validation)) {
        break;
      }
    }
    return aggregator.result;
  };
  const parse: Schema<ResultI, ResultO, unknown>["parse"] = (v, o) => {
    let validation: ValidationResult<unknown>;
    let successSchema: Schema<unknown> | undefined;
    for (const schema of schemas) {
      validation = schema.validate(v, o);
      if (isSuccess(validation)) {
        successSchema = schema;
        break;
      }
    }
    if (successSchema === undefined) {
      return { validation } as ParseResult<ResultI, ResultO>;
    }
    return successSchema.parse(v, {
      ...o,
      skipValidation: true,
    }) as ParseResult<ResultI, ResultO>;
  };
  const parseAsync: Schema<ResultI, ResultO, unknown>["parseAsync"] = async (
    v,
    o
  ) => {
    let validation: ValidationResult<unknown>;
    let successSchema: Schema<unknown> | undefined;
    for (const schema of schemas) {
      validation = await schema.validateAsync(v, o);
      if (isSuccess(validation)) {
        successSchema = schema;
        break;
      }
    }
    if (successSchema === undefined) {
      return { validation } as ParseResult<ResultI, ResultO>;
    }
    return successSchema.parse(v, {
      ...o,
      skipValidation: true,
    }) as ParseResult<ResultI, ResultO>;
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
