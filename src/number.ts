import { makeSchema, refine, Schema } from "./schema";

export function number(): Schema<number> {
  return makeSchema((v) => {
    if (typeof v !== "number") {
      return "value should be a number";
    }
    if (Number.isNaN(v)) {
      return "value should not be NaN";
    }
  });
}
export function nan(): Schema<number> {
  return makeSchema((v) => {
    if (!Number.isNaN(v)) {
      return "value should be NaN";
    }
  });
}
export function positive(schema: Schema<number>): Schema<number> {
  return refine(schema, (v) => {
    if (v <= 0) {
      return "value should be positive";
    }
  });
}
export function negative(schema: Schema<number>): Schema<number> {
  return refine(schema, (v) => {
    if (v >= 0) {
      return "value should be negative";
    }
  });
}
export function nonNegative(schema: Schema<number>): Schema<number> {
  return refine(schema, (v) => {
    if (v < 0) {
      return "value should be non-negative";
    }
  });
}
export function integer(schema: Schema<number>): Schema<number> {
  return refine(schema, (v) => {
    if (!Number.isInteger(v)) {
      return "value should be an integer";
    }
  });
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

export function multipleOf(
  schema: Schema<number>,
  value: number
): Schema<number> {
  return refine(schema, (v) => {
    if (floatSafeRemainder(v, value) > 0) {
      return `value should be a multiple of ${value}`;
    }
  });
}

export function lessThan(
  schema: Schema<number>,
  value: number
): Schema<number> {
  return refine(schema, (v) => {
    if (v >= value) {
      return `value should be less than ${value}`;
    }
  });
}
export function greaterThan(
  schema: Schema<number>,
  value: number
): Schema<number> {
  return refine(schema, (v) => {
    if (v <= value) {
      return `value should be greater than ${value}`;
    }
  });
}
export function lessThanOrEqual(
  schema: Schema<number>,
  value: number
): Schema<number> {
  return refine(schema, (v) => {
    if (v > value) {
      return `value should be less than or equal ${value}`;
    }
  });
}
export function greaterThanOrEqual(
  schema: Schema<number>,
  value: number
): Schema<number> {
  return refine(schema, (v) => {
    if (v < value) {
      return `value should be greater than or equal ${value}`;
    }
  });
}
