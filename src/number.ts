import { makeSchema, refineWithMetainformation, Schema } from "./schema";
import { makeError } from "./validation";

export function number(): Schema<number, { type: "number" }> {
  return makeSchema(
    (v) => {
      if (typeof v !== "number") {
        return makeError("wrong_type", v, "number");
      }
      if (Number.isNaN(v)) {
        return makeError("invalid_value", v, "isNaN");
      }
    },
    () => ({ type: "number" })
  );
}
export function nan(): Schema<number, { type: "nan" }> {
  return makeSchema(
    (v) => {
      if (!Number.isNaN(v)) {
        return makeError("wrong_type", v, "nan");
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
        return makeError("invalid_value", v, "positive");
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
        return makeError("invalid_value", v, "nonPositive");
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
        return makeError("invalid_value", v, "negative");
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
        return makeError("invalid_value", v, "nonNegative");
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
        return makeError("wrong_type", v, "integer");
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
        return makeError("invalid_value", v, "multipleOf", value);
      }
    },
    { multipleOf: value }
  );
}
export function equals<M>(schema: Schema<number, M>, value: number) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v !== value) {
        return makeError("invalid_value", v, "equals", value);
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
        return makeError("invalid_value", v, "exclusiveMaximum", value);
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
        return makeError("invalid_value", v, "exclusiveMinimum", value);
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
        return makeError("invalid_value", v, "maximum", value);
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
        return makeError("invalid_value", v, "minimum", value);
      }
    },
    { minimum: value }
  );
}
