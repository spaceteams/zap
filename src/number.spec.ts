/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { integer, nan, negative, number, positive, multipleOf } from "./number";
import { or } from "./or";
import { translate } from "./validation";

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
  expect(translate(number().validate(Number.NaN))).toEqual(
    "validation failed: isNaN()"
  );
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

    expect(translate(schema.validate(0))).toEqual(
      "validation failed: positive()"
    );
    expect(translate(schema.validate(-1))).toEqual(
      "validation failed: positive()"
    );
    expect(translate(schema.validate(-0))).toEqual(
      "validation failed: positive()"
    );
  });
});

describe("negative", () => {
  const schema = negative(number());
  it("validates", () => {
    expect(schema.validate(-1)).toBeUndefined();

    expect(translate(schema.validate(-0))).toEqual(
      "validation failed: negative()"
    );
    expect(translate(schema.validate(1))).toEqual(
      "validation failed: negative()"
    );
    expect(translate(schema.validate(0))).toEqual(
      "validation failed: negative()"
    );
  });
});

describe("int", () => {
  const schema = integer(number());
  it("validates", () => {
    expect(schema.validate(-1)).toBeUndefined();

    expect(translate(schema.validate(0.1))).toEqual(
      "value was of type number expected integer"
    );
    expect(translate(schema.validate(Number.POSITIVE_INFINITY))).toEqual(
      "value was of type number expected integer"
    );
  });
});

describe("multipleOf", () => {
  const schema = multipleOf(number(), 0.1);
  it("validates", () => {
    expect(schema.validate(-1)).toBeUndefined();
    expect(schema.validate(-1.2)).toBeUndefined();

    expect(translate(schema.validate(-1.21))).toEqual(
      "validation failed: multipleOf(0.1)"
    );
  });
});
