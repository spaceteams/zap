import {
  coerce,
  makeSchema,
  refineWithMetainformation,
  Schema,
} from "../schema";
import { ValidationIssue } from "../validation";

export function number(
  issues?: Partial<{
    required: string;
    wrongType: string;
    isNan: string;
  }>
): Schema<number, number, { type: "number" }> {
  return makeSchema(
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
  return makeSchema(
    (v) => {
      if (!Number.isNaN(v)) {
        return new ValidationIssue("wrong_type", issue, v, "nan");
      }
    },
    () => ({ type: "nan" })
  );
}
export function positive<O, M>(schema: Schema<number, O, M>, issue?: string) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v <= 0) {
        return new ValidationIssue("positive", issue, v);
      }
    },
    { exclusiveMinimum: 0 }
  );
}
export function nonPositive<O, M>(
  schema: Schema<number, O, M>,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v <= 0) {
        return new ValidationIssue("nonPositive", issue, v);
      }
    },
    { maximum: 0 }
  );
}
export function negative<O, M>(schema: Schema<number, O, M>, issue?: string) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v >= 0) {
        return new ValidationIssue("negative", issue, v);
      }
    },
    { minimum: 0 }
  );
}
export function nonNegative<O, M>(
  schema: Schema<number, O, M>,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v < 0) {
        return new ValidationIssue("nonNegative", issue, v);
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

export function exclusiveMaximum<O, M>(
  schema: Schema<number, O, M>,
  value: number,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v >= value) {
        return new ValidationIssue("exclusiveMaximum", issue, v, value);
      }
    },
    { exclusiveMaximum: value }
  );
}
export function exclusiveMinimum<O, M>(
  schema: Schema<number, O, M>,
  value: number,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v <= value) {
        return new ValidationIssue("exclusiveMinimum", issue, v, value);
      }
    },
    { exclusiveMinimum: value }
  );
}
export function maximum<O, M>(
  schema: Schema<number, O, M>,
  value: number,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v > value) {
        return new ValidationIssue("maximum", issue, v, value);
      }
    },
    { maximum: value }
  );
}
export function minimum<O, M>(
  schema: Schema<number, O, M>,
  value: number,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v < value) {
        return new ValidationIssue("minimum", issue, v, value);
      }
    },
    { minimum: value }
  );
}
