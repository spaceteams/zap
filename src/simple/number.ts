import { makeSchema, refineWithMetainformation, Schema } from "../schema";
import { makeIssue } from "../validation";

export function number(
  issues?: Partial<{
    required: string;
    wrongType: string;
    isNan: string;
  }>
): Schema<number, { type: "number" }> {
  return makeSchema(
    (v) => {
      if (typeof v === "undefined" || v === null) {
        return makeIssue("required", issues?.required, v);
      }
      if (typeof v !== "number") {
        return makeIssue("wrong_type", issues?.wrongType, v, "number");
      }
      if (Number.isNaN(v)) {
        return makeIssue("isNaN", issues?.isNan, v);
      }
    },
    () => ({ type: "number" })
  );
}
export function nan(issue?: string): Schema<number, { type: "nan" }> {
  return makeSchema(
    (v) => {
      if (!Number.isNaN(v)) {
        return makeIssue("wrong_type", issue, v, "nan");
      }
    },
    () => ({ type: "nan" })
  );
}
export function positive<M>(schema: Schema<number, M>, issue?: string) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v <= 0) {
        return makeIssue("positive", issue, v);
      }
    },
    { exclusiveMinimum: 0 }
  );
}
export function nonPositive<M>(schema: Schema<number, M>, issue?: string) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v <= 0) {
        return makeIssue("nonPositive", issue, v);
      }
    },
    { maximum: 0 }
  );
}
export function negative<M>(schema: Schema<number, M>, issue?: string) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v >= 0) {
        return makeIssue("negative", issue, v);
      }
    },
    { minimum: 0 }
  );
}
export function nonNegative<M>(schema: Schema<number, M>, issue?: string) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v < 0) {
        return makeIssue("nonNegative", issue, v);
      }
    },
    { exclusiveMaximum: 0 }
  );
}
export function integer<M>(schema: Schema<number, M>, issue?: string) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (!Number.isInteger(v)) {
        return makeIssue("integer", issue, v);
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

export function multipleOf<M>(
  schema: Schema<number, M>,
  value: number,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (floatSafeRemainder(v, value) > 0) {
        return makeIssue("multipleOf", issue, v, value);
      }
    },
    { multipleOf: value }
  );
}

export function exclusiveMaximum<M>(
  schema: Schema<number, M>,
  value: number,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v >= value) {
        return makeIssue("exclusiveMaximum", issue, v, value);
      }
    },
    { exclusiveMaximum: value }
  );
}
export function exclusiveMinimum<M>(
  schema: Schema<number, M>,
  value: number,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v <= value) {
        return makeIssue("exclusiveMinimum", issue, v, value);
      }
    },
    { exclusiveMinimum: value }
  );
}
export function maximum<M>(
  schema: Schema<number, M>,
  value: number,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v > value) {
        return makeIssue("maximum", issue, v, value);
      }
    },
    { maximum: value }
  );
}
export function minimum<M>(
  schema: Schema<number, M>,
  value: number,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v < value) {
        return makeIssue("minimum", issue, v, value);
      }
    },
    { minimum: value }
  );
}
