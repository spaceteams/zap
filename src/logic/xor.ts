import { Unionize } from "../utility";
import {
  InferOutputTypes,
  InferTypes,
  ParseResult,
  Schema,
  ValidationOptions,
} from "../schema";
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

    public lastFailure: ValidationResult<ResultI> = undefined;
    private xorValidation: V;
    private oneSuccess = false;

    onValidate(v: unknown, validation: ValidationResult<unknown>): boolean {
      if (isSuccess(validation)) {
        if (this.oneSuccess) {
          this.xorValidation = new ValidationIssue("xor", issue, v) as V;
          this.oneSuccess = false;
          return true;
        } else {
          this.oneSuccess = true;
        }
      } else {
        this.lastFailure = validation as ValidationResult<ResultI>;
      }
      return false;
    }

    result(): V {
      if (!this.oneSuccess) {
        return this.xorValidation ?? this.lastFailure;
      }
    }
  }

  const validate: Schema<ResultI, ResultO, unknown>["validate"] = (v, o) => {
    const aggregator = new Aggregator(o);
    for (const schema of schemas) {
      const validation = schema.validate(v, o);
      if (aggregator.onValidate(v, validation)) {
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
      if (aggregator.onValidate(v, validation)) {
        break;
      }
    }
    return aggregator.result();
  };
  const parse: Schema<ResultI, ResultO, unknown>["parse"] = (v, o) => {
    let validation: ValidationResult<unknown>;
    let successSchema: Schema<unknown> | undefined;
    for (const schema of schemas) {
      validation = schema.validate(v, o);
      if (isSuccess(validation)) {
        if (successSchema !== undefined) {
          return {
            validation: new ValidationIssue("xor", issue, v) as V,
          };
        }
        successSchema = schema;
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
        if (successSchema !== undefined) {
          return {
            validation: new ValidationIssue("xor", issue, v) as V,
          };
        }
        successSchema = schema;
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
    meta: () => ({ type: "xor", schemas }),
  };
}
