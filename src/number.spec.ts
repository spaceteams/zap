/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { nan, negative, number, positive } from "./number";
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
  it("validates", () => {
    expect(positive(number()).validate(1)).toBeUndefined();

    expect(positive(number()).validate(0)).toEqual("value should be positive");
    expect(positive(number()).validate(-1)).toEqual("value should be positive");
    expect(positive(number()).validate(-0)).toEqual("value should be positive");
  });
});

describe("negative", () => {
  it("validates", () => {
    expect(negative(number()).validate(-1)).toBeUndefined();

    expect(negative(number()).validate(-0)).toEqual("value should be negative");
    expect(negative(number()).validate(1)).toEqual("value should be negative");
    expect(negative(number()).validate(0)).toEqual("value should be negative");
  });
});
