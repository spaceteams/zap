import { refineWithMetainformation } from "../refine";
import { coerce, makeSimpleSchema, Schema } from "../schema";
import { ValidationIssue, ValidationResult } from "../validation";

export function number(
  issues?: Partial<{
    required: string;
    wrongType: string;
    isNan: string;
  }>
): Schema<number, number, { type: "number" }> {
  return makeSimpleSchema(
    (v) => {
      if (typeof v === "undefined" || v === null) {
        return new ValidationIssue("required", issues?.required, v);
      }
      if (typeof v !== "number") {
        return new ValidationIssue(
          "wrong_type",
          issues?.wrongType,
          v,
          "number"
        );
      }
      if (Number.isNaN(v)) {
        return new ValidationIssue("isNaN", issues?.isNan, v);
      }
    },
    () => ({ type: "number" })
  );
}

export function coercedNumber(
  issues?: Partial<{
    required: string;
    wrongType: string;
    isNan: string;
  }>
) {
  return coerce(number(issues), Number);
}

export function nan(issue?: string): Schema<number, number, { type: "nan" }> {
  return makeSimpleSchema(
    (v) => {
      if (!Number.isNaN(v)) {
        return new ValidationIssue("wrong_type", issue, v, "nan");
      }
    },
    () => ({ type: "nan" })
  );
}
export function positive<T extends number | bigint, O, M>(
  schema: Schema<T, O, M>,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v <= 0) {
        return new ValidationIssue("positive", issue, v) as ValidationResult<T>;
      }
    },
    { exclusiveMinimum: 0 }
  );
}
export function nonPositive<T extends number | bigint, O, M>(
  schema: Schema<T, O, M>,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v > 0) {
        return new ValidationIssue(
          "nonPositive",
          issue,
          v
        ) as ValidationResult<T>;
      }
    },
    { maximum: 0 }
  );
}
export function negative<T extends number | bigint, O, M>(
  schema: Schema<T, O, M>,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v >= 0) {
        return new ValidationIssue("negative", issue, v) as ValidationResult<T>;
      }
    },
    { minimum: 0 }
  );
}
export function nonNegative<T extends number | bigint, O, M>(
  schema: Schema<T, O, M>,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v < 0) {
        return new ValidationIssue(
          "nonNegative",
          issue,
          v
        ) as ValidationResult<T>;
      }
    },
    { exclusiveMaximum: 0 }
  );
}
export function integer<O, M>(schema: Schema<number, O, M>, issue?: string) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (!Number.isInteger(v)) {
        return new ValidationIssue("integer", issue, v);
      }
    },
    { isInteger: true }
  );
}

// https://stackoverflow.com/questions/3966484/why-does-modulus-operator-return-fractional-number-in-javascript/31711034#31711034
function floatSafeRemainder(val: number, step: number) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return (((valInt % stepInt) + stepInt) % stepInt) / Math.pow(10, decCount);
}

export function multipleOf<O, M>(
  schema: Schema<number, O, M>,
  value: number,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (floatSafeRemainder(v, value) > 0) {
        return new ValidationIssue("multipleOf", issue, v, value);
      }
    },
    { multipleOf: value }
  );
}

export function exclusiveMaximum<T extends number | bigint, O, M>(
  schema: Schema<T, O, M>,
  value: number | bigint,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v >= value) {
        return new ValidationIssue(
          "exclusiveMaximum",
          issue,
          v,
          value
        ) as ValidationResult<T>;
      }
    },
    { exclusiveMaximum: value }
  );
}
export function exclusiveMinimum<T extends number | bigint, O, M>(
  schema: Schema<T, O, M>,
  value: number | bigint,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v <= value) {
        return new ValidationIssue(
          "exclusiveMinimum",
          issue,
          v,
          value
        ) as ValidationResult<T>;
      }
    },
    { exclusiveMinimum: value }
  );
}
export function maximum<T extends number | bigint, O, M>(
  schema: Schema<T, O, M>,
  value: number | bigint,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v > value) {
        return new ValidationIssue(
          "maximum",
          issue,
          v,
          value
        ) as ValidationResult<T>;
      }
    },
    { maximum: value }
  );
}
export function minimum<T extends number | bigint, O, M>(
  schema: Schema<T, O, M>,
  value: number | bigint,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v < value) {
        return new ValidationIssue(
          "minimum",
          issue,
          v,
          value
        ) as ValidationResult<T>;
      }
    },
    { minimum: value }
  );
}
