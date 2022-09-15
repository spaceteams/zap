import { makeSchema, refineWithMetainformation, Schema } from "./schema";

export function number(): Schema<number, { type: "number" }> {
  return makeSchema(
    (v) => {
      if (typeof v !== "number") {
        return "value should be a number";
      }
      if (Number.isNaN(v)) {
        return "value should not be NaN";
      }
    },
    () => ({ type: "number" })
  );
}
export function nan(): Schema<number, { type: "nan" }> {
  return makeSchema(
    (v) => {
      if (!Number.isNaN(v)) {
        return "value should be NaN";
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
        return "value should be positive";
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
        return "value should be non-positive";
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
        return "value should be negative";
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
        return "value should be non-negative";
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
        return "value should be an integer";
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
        return `value should be a multiple of ${value}`;
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
        return `value should be less than ${value}`;
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
        return `value should be greater than ${value}`;
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
        return `value should be less than or equal ${value}`;
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
        return `value should be greater than or equal ${value}`;
      }
    },
    { minimum: value }
  );
}
