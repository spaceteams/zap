import { makeSchema, refineWithMetainformation, Schema } from "../schema";
import { makeIssue } from "../validation";

export function number(): Schema<number, { type: "number" }> {
  return makeSchema(
    (v) => {
      if (typeof v !== "number") {
        return makeIssue("wrong_type", v, "number");
      }
      if (Number.isNaN(v)) {
        return makeIssue("isNaN", v);
      }
    },
    () => ({ type: "number" })
  );
}
export function nan(): Schema<number, { type: "nan" }> {
  return makeSchema(
    (v) => {
      if (!Number.isNaN(v)) {
        return makeIssue("wrong_type", v, "nan");
      }
    },
    () => ({ type: "nan" })
  );
}
export function positive<M>(schema: Schema<number, M>) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v <= 0) {
        return makeIssue("positive", v);
      }
    },
    { exclusiveMinimum: 0 }
  );
}
export function nonPositive<M>(schema: Schema<number, M>) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v <= 0) {
        return makeIssue("nonPositive", v);
      }
    },
    { maximum: 0 }
  );
}
export function negative<M>(schema: Schema<number, M>) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v >= 0) {
        return makeIssue("negative", v);
      }
    },
    { minimum: 0 }
  );
}
export function nonNegative<M>(schema: Schema<number, M>) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v < 0) {
        return makeIssue("nonNegative", v);
      }
    },
    { exclusiveMaximum: 0 }
  );
}
export function integer<M>(schema: Schema<number, M>) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (!Number.isInteger(v)) {
        return makeIssue("wrong_type", v, "integer");
      }
    },
    { type: "integer" as const }
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

export function multipleOf<M>(schema: Schema<number, M>, value: number) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (floatSafeRemainder(v, value) > 0) {
        return makeIssue("multipleOf", v, value);
      }
    },
    { multipleOf: value }
  );
}

export function exclusiveMaximum<M>(schema: Schema<number, M>, value: number) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v >= value) {
        return makeIssue("exclusiveMaximum", v, value);
      }
    },
    { exclusiveMaximum: value }
  );
}
export function exclusiveMinimum<M>(schema: Schema<number, M>, value: number) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v <= value) {
        return makeIssue("exclusiveMinimum", v, value);
      }
    },
    { exclusiveMinimum: value }
  );
}
export function maximum<M>(schema: Schema<number, M>, value: number) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v > value) {
        return makeIssue("maximum", v, value);
      }
    },
    { maximum: value }
  );
}
export function minimum<M>(schema: Schema<number, M>, value: number) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v < value) {
        return makeIssue("minimum", v, value);
      }
    },
    { minimum: value }
  );
}
