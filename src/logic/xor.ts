import {
  InferOutputTypes,
  InferTypes,
  ParseResult,
  Schema,
  ValidationOptions,
} from "../schema";
import { Unionize } from "../utility";
import { isSuccess, ValidationIssue, ValidationResult } from "../validation";

export function xor<T extends readonly Schema<unknown>[]>(
  ...schemas: T
): Schema<
  Unionize<InferTypes<T>>,
  Unionize<InferOutputTypes<T>>,
  { type: "xor"; schemas: T }
> {
  return xorWithIssue(schemas);
}

export function xorWithIssue<T extends readonly Schema<unknown>[]>(
  schemas: T,
  issue?: string
): Schema<
  Unionize<InferTypes<T>>,
  Unionize<InferOutputTypes<T>>,
  { type: "xor"; schemas: T }
> {
  type ResultI = Unionize<InferTypes<T>>;
  type ResultO = Unionize<InferOutputTypes<T>>;
  type V = ValidationResult<ResultI>;

  class Aggregator {
    constructor(readonly options: Partial<ValidationOptions> | undefined) {}

    public lastFailure: ValidationResult<ResultI>;
    private xorValidation: V;
    private successSchema: Schema<unknown> | undefined;

    onValidate(
      v: unknown,
      schema: Schema<unknown>,
      validation: ValidationResult<unknown>
    ): boolean {
      if (isSuccess(validation)) {
        if (this.successSchema) {
          this.xorValidation = new ValidationIssue("xor", issue, v) as V;
          this.successSchema = undefined;
          return true;
        } else {
          this.successSchema = schema;
        }
      } else {
        this.lastFailure = validation as ValidationResult<ResultI>;
      }
      return false;
    }

    result(): V {
      if (!this.successSchema) {
        return this.xorValidation ?? this.lastFailure;
      }
    }

    parseResult(v: unknown): ParseResult<ResultI, ResultO> {
      if (this.successSchema === undefined) {
        return { validation: this.xorValidation ?? this.lastFailure };
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
      if (aggregator.onValidate(v, schema, validation)) {
        break;
      }
    }
    return aggregator.result();
  };
  const validateAsync: Schema<
    ResultI,
    ResultO,
    unknown
  >["validateAsync"] = async (v, o) => {
    const aggregator = new Aggregator(o);
    for (const schema of schemas) {
      const validation = await schema.validateAsync(v, o);
      if (aggregator.onValidate(v, schema, validation)) {
        break;
      }
    }
    return aggregator.result();
  };
  const parse: Schema<ResultI, ResultO, unknown>["parse"] = (v, o) => {
    const aggregator = new Aggregator(o);
    for (const schema of schemas) {
      const validation = schema.validate(v, o);
      if (aggregator.onValidate(v, schema, validation)) {
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
      if (aggregator.onValidate(v, schema, validation)) {
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
    meta: () => ({ type: "xor", schemas }),
  };
}
