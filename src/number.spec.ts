import { negative, number, positive } from "./number";

/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

it("accepts", () => {
  expect(number().accepts(0)).toBeTruthy();
  expect(number().accepts(Number.NaN)).toBeTruthy();
  expect(number().accepts(Number.POSITIVE_INFINITY)).toBeTruthy();

  expect(number().accepts(undefined)).toBeFalsy();
  expect(number().accepts(null)).toBeFalsy();
});

it("validates", () => {
  expect(number().validate(0)).toBeUndefined();
  expect(number().validate(undefined)).toEqual("value should be a number");
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
