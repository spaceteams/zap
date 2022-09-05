/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { integer, nan, negative, number, positive, multipleOf } from "./number";
import { or } from "./or";

it("accepts", () => {
  expect(number().accepts(0)).toBeTruthy();
  expect(number().accepts(Number.POSITIVE_INFINITY)).toBeTruthy();

  expect(number().accepts(Number.NaN)).toBeFalsy();
  expect(number().accepts(undefined)).toBeFalsy();
  expect(number().accepts(null)).toBeFalsy();
});

it("validates", () => {
  expect(number().validate(0)).toBeUndefined();
  expect(number().validate(undefined)).toEqual("value should be a number");
  expect(number().validate(Number.NaN)).toEqual("value should not be NaN");
});

describe("nan", () => {
  it("accepts", () => {
    expect(nan().accepts(Number.NaN)).toBeTruthy();
    expect(or(number(), nan()).accepts(Number.NaN)).toBeTruthy();

    expect(nan().accepts(0)).toBeFalsy();
  });
  it("validates", () => {
    expect(nan().validate(Number.NaN)).toBeUndefined();

    expect(nan().validate(0)).toEqual("value should be NaN");
  });
});

describe("positive", () => {
  const schema = positive(number());
  it("validates", () => {
    expect(schema.validate(1)).toBeUndefined();

    expect(schema.validate(0)).toEqual("value should be positive");
    expect(schema.validate(-1)).toEqual("value should be positive");
    expect(schema.validate(-0)).toEqual("value should be positive");
  });
});

describe("negative", () => {
  const schema = negative(number());
  it("validates", () => {
    expect(schema.validate(-1)).toBeUndefined();

    expect(schema.validate(-0)).toEqual("value should be negative");
    expect(schema.validate(1)).toEqual("value should be negative");
    expect(schema.validate(0)).toEqual("value should be negative");
  });
});

describe("int", () => {
  const schema = integer(number());
  it("validates", () => {
    expect(schema.validate(-1)).toBeUndefined();

    expect(schema.validate(0.1)).toEqual("value should be an integer");
    expect(schema.validate(Number.POSITIVE_INFINITY)).toEqual(
      "value should be an integer"
    );
  });
});

describe("multipleOf", () => {
  const schema = multipleOf(number(), 0.1);
  it("validates", () => {
    expect(schema.validate(-1)).toBeUndefined();
    expect(schema.validate(-1.2)).toBeUndefined();

    expect(schema.validate(-1.21)).toEqual("value should be a multiple of 0.1");
  });
});
