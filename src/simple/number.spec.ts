/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import {
  integer,
  nan,
  negative,
  number,
  positive,
  multipleOf,
  coercedNumber,
  nonPositive,
  nonNegative,
  exclusiveMinimum,
  exclusiveMaximum,
  minimum,
  maximum,
} from "./number";
import { or } from "../logic/or";
import { translate } from "../validation";

it("accepts", () => {
  expect(number().accepts(0)).toBeTruthy();
  expect(number().accepts(Number.POSITIVE_INFINITY)).toBeTruthy();

  expect(number().accepts(Number.NaN)).toBeFalsy();
  expect(number().accepts(undefined)).toBeFalsy();
  expect(number().accepts(null)).toBeFalsy();
});

it("validates", () => {
  expect(number().validate(0)).toBeUndefined();
  expect(translate(number().validate(undefined))).toEqual("value is required");
  expect(translate(number().validate(Number.NaN))).toEqual("isNaN");
});

describe("coercedNumber", () => {
  it("parses", () => {
    expect(coercedNumber().parse(1).parsedValue).toEqual(1);
    expect(coercedNumber().parse("1").parsedValue).toEqual(1);
    expect(coercedNumber().parse(true).parsedValue).toEqual(1);
    expect(coercedNumber().parse(false).parsedValue).toEqual(0);
    expect(coercedNumber().parse(null).parsedValue).toEqual(0);
    expect(coercedNumber().parse([]).parsedValue).toEqual(0);

    expect(coercedNumber().parse(undefined).validation).toBeDefined();
    expect(coercedNumber().parse([1, "a", 2]).validation).toBeDefined();
    expect(coercedNumber().parse({}).validation).toBeDefined();
    expect(coercedNumber().parse(() => 1).validation).toBeDefined();
  });
});

describe("nan", () => {
  it("accepts", () => {
    expect(nan().accepts(Number.NaN)).toBeTruthy();
    expect(or(number(), nan()).accepts(Number.NaN)).toBeTruthy();

    expect(nan().accepts(0)).toBeFalsy();
  });
  it("validates", () => {
    expect(nan().validate(Number.NaN)).toBeUndefined();

    expect(translate(nan().validate(0))).toEqual(
      "value was of type number expected nan"
    );
  });
});

describe("positive", () => {
  const schema = positive(number());
  it("validates", () => {
    expect(schema.validate(1)).toBeUndefined();

    expect(translate(schema.validate(0))).toEqual("positive");
    expect(translate(schema.validate(-1))).toEqual("positive");
    expect(translate(schema.validate(-0))).toEqual("positive");
  });
});

describe("nonPositive", () => {
  const schema = nonPositive(number());
  it("validates", () => {
    expect(schema.validate(0)).toBeUndefined();
    expect(schema.validate(-1)).toBeUndefined();
    expect(schema.validate(-0)).toBeUndefined();

    expect(translate(schema.validate(1))).toEqual("nonPositive");
  });
});

describe("negative", () => {
  const schema = negative(number());
  it("validates", () => {
    expect(schema.validate(-1)).toBeUndefined();

    expect(translate(schema.validate(-0))).toEqual("negative");
    expect(translate(schema.validate(1))).toEqual("negative");
    expect(translate(schema.validate(0))).toEqual("negative");
  });
});

describe("nonNegative", () => {
  const schema = nonNegative(number());
  it("validates", () => {
    expect(schema.validate(1)).toBeUndefined();
    expect(translate(schema.validate(0))).toBeUndefined();
    expect(translate(schema.validate(-0))).toBeUndefined();

    expect(translate(schema.validate(-1))).toEqual("nonNegative");
  });
});

describe("integer", () => {
  const schema = integer(number());
  it("validates", () => {
    expect(schema.validate(-1)).toBeUndefined();

    expect(translate(schema.validate(0.1))).toEqual("integer");
    expect(translate(schema.validate(Number.POSITIVE_INFINITY))).toEqual(
      "integer"
    );
  });
});

describe("multipleOf", () => {
  const schema = multipleOf(number(), 0.1);
  it("validates", () => {
    expect(schema.validate(-1)).toBeUndefined();
    expect(schema.validate(-1.2)).toBeUndefined();

    expect(translate(schema.validate(-1.21))).toEqual("multipleOf(0.1)");
  });
});

describe("exclusiveMinimum", () => {
  const schema = exclusiveMinimum(number(), 0.1);
  it("validates", () => {
    expect(schema.validate(0.11)).toBeUndefined();
    expect(translate(schema.validate(0.1))).toEqual("exclusiveMinimum(0.1)");
    expect(translate(schema.validate(0.09))).toEqual("exclusiveMinimum(0.1)");
  });
});

describe("exclusiveMaximum", () => {
  const schema = exclusiveMaximum(number(), 0.1);
  it("validates", () => {
    expect(translate(schema.validate(0.11))).toEqual("exclusiveMaximum(0.1)");
    expect(translate(schema.validate(0.1))).toEqual("exclusiveMaximum(0.1)");
    expect(translate(schema.validate(0.09))).toBeUndefined();
  });
});

describe("minimum", () => {
  const schema = minimum(number(), 0.1);
  it("validates", () => {
    expect(schema.validate(0.11)).toBeUndefined();
    expect(translate(schema.validate(0.1))).toBeUndefined();
    expect(translate(schema.validate(0.09))).toEqual("minimum(0.1)");
  });
});

describe("maximum", () => {
  const schema = maximum(number(), 0.1);
  it("validates", () => {
    expect(translate(schema.validate(0.11))).toEqual("maximum(0.1)");
    expect(translate(schema.validate(0.1))).toBeUndefined();
    expect(translate(schema.validate(0.09))).toBeUndefined();
  });
});
