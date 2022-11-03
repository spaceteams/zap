/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { bigInt, coercedBigInt } from "./bigint";
import { translate } from "../validation";
import {
  exclusiveMaximum,
  exclusiveMinimum,
  maximum,
  minimum,
  negative,
  nonNegative,
  nonPositive,
  positive,
} from "./number";

it("accepts", () => {
  expect(bigInt().accepts(0n)).toBeTruthy();

  expect(bigInt().accepts(0)).toBeFalsy();
  expect(bigInt().accepts(undefined)).toBeFalsy();
  expect(bigInt().accepts(null)).toBeFalsy();
});

it("validates", () => {
  expect(bigInt().validate(0n)).toBeUndefined();
  expect(translate(bigInt().validate(0))).toEqual(
    "value was of type number expected bigint"
  );
  expect(translate(bigInt().validate(undefined))).toEqual("value is required");
});

describe("coercedBigInt", () => {
  it("parses", () => {
    expect(coercedBigInt().parse(1).parsedValue).toEqual(1n);
    expect(coercedBigInt().parse("1").parsedValue).toEqual(1n);
    expect(coercedBigInt().parse(true).parsedValue).toEqual(1n);
    expect(coercedBigInt().parse(false).parsedValue).toEqual(0n);

    expect(coercedBigInt().parse(1.1).validation).toBeDefined();
    expect(coercedBigInt().parse("1.1").validation).toBeDefined();
    expect(coercedBigInt().parse(null).validation).toBeDefined();
    expect(coercedBigInt().parse(undefined).validation).toBeDefined();
    expect(coercedBigInt().parse([]).validation).toBeDefined();
  });
});

test("number refinements also work for bigint", () => {
  expect(positive(bigInt()).accepts(1n)).toBeTruthy();
  expect(negative(bigInt()).accepts(-1n)).toBeTruthy();
  expect(nonPositive(bigInt()).accepts(0n)).toBeTruthy();
  expect(nonNegative(bigInt()).accepts(0n)).toBeTruthy();

  expect(minimum(bigInt(), 10n).accepts(10n)).toBeTruthy();
  expect(minimum(bigInt(), 10).accepts(10n)).toBeTruthy();
  expect(maximum(bigInt(), 10n).accepts(10n)).toBeTruthy();
  expect(maximum(bigInt(), 10).accepts(10n)).toBeTruthy();
  expect(exclusiveMaximum(bigInt(), 10n).accepts(9n)).toBeTruthy();
  expect(exclusiveMaximum(bigInt(), 10).accepts(9n)).toBeTruthy();
  expect(exclusiveMinimum(bigInt(), 10n).accepts(11n)).toBeTruthy();
  expect(exclusiveMinimum(bigInt(), 10).accepts(11n)).toBeTruthy();
});
