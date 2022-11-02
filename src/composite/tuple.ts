import {
  InferTypes,
  getOption,
  makeSchema,
  Schema,
  InferOutputTypes,
} from "../schema";
import {
  isFailure,
  isSuccess,
  ValidationIssue,
  ValidationResult,
} from "../validation";

export function tuple<T extends readonly Schema<unknown>[]>(
  ...schemas: T
): Schema<InferTypes<T>, InferOutputTypes<T>, { type: "tuple"; schemas: T }> {
  return tupleWithIssues(schemas);
}

export function tupleWithIssues<T extends readonly Schema<unknown>[]>(
  schemas: T,
  issues?: Partial<{
    required: string;
    wrongType: string;
    length: string;
  }>
): Schema<InferTypes<T>, InferOutputTypes<T>, { type: "tuple"; schemas: T }> {
  type ResultI = InferTypes<T>;
  type ResultO = InferOutputTypes<T>;
  type V = ValidationResult<ResultI>;

  const preValidate = (v: unknown) => {
    if (typeof v === "undefined" || v === null) {
      return new ValidationIssue("required", issues?.required, v) as V;
    }
    if (!Array.isArray(v)) {
      return new ValidationIssue(
        "wrong_type",
        issues?.wrongType,
        v,
        "array"
      ) as V;
    }
    if (schemas.length !== v.length) {
      return new ValidationIssue(
        "length",
        issues?.length,
        v,
        schemas.length
      ) as V;
    }
  };

  class Aggregator {
    constructor(readonly earlyExit: boolean) {}

    public readonly validations: ValidationResult<unknown>[] = [];

    onValidate(validation: ValidationResult<unknown>): boolean {
      this.validations.push(validation);
      return this.earlyExit && isFailure(validation);
    }
    result(): V {
      if (this.validations.every((v) => isSuccess(v))) {
        return undefined;
      }
      return this.validations as V;
    }
  }

  return makeSchema(
    (v, o) => {
      const validation = preValidate(v);
      if (isFailure(validation)) {
        return validation;
      }

      const aggregator = new Aggregator(getOption(o, "earlyExit"));
      let i = 0;
      for (const value of v as unknown[]) {
        const validation = schemas[i].validate(value, o);
        i++;

        if (aggregator.onValidate(validation)) {
          break;
        }
      }
      return aggregator.result();
    },
    async (v, o) => {
      const validation = preValidate(v);
      if (isFailure(validation)) {
        return validation;
      }

      const aggregator = new Aggregator(getOption(o, "earlyExit"));
      let i = 0;
      for (const value of v as unknown[]) {
        const validation = await schemas[i].validateAsync(value, o);
        i++;

        if (aggregator.onValidate(validation)) {
          break;
        }
      }
      return aggregator.result();
    },
    () => ({ type: "tuple", schemas }),
    (v, o) => {
      const result: unknown[] = [];
      let i = 0;
      for (const value of v) {
        result.push(schemas[i].parse(value, o).parsedValue);
        i++;
      }
      return result as ResultO;
    }
  );
}
