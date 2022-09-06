/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { literal } from "./literal";
import { number } from "./number";
import { tuple } from "./tuple";

const schema = tuple(number(), literal("a"));

it("accepts", () => {
  expect(schema.accepts([1, "a"])).toBeTruthy();

  expect(schema.accepts([])).toBeFalsy();
  expect(schema.accepts([1, "b"])).toBeFalsy();
  expect(schema.accepts(null)).toBeFalsy();
  expect(schema.accepts(undefined)).toBeFalsy();
});
it("validates", () => {
  expect(schema.validate([1, "a"])).toBeUndefined();

  expect(schema.validate([Number.NaN, "b"])).toEqual([
    "value should not be NaN",
    "value should literally be a",
  ]);
  expect(schema.validate(null)).toEqual("value should be an array");
  expect(schema.validate([])).toEqual("value should have length 2");
});
it("validates with early exit", () => {
  expect(schema.validate([Number.NaN, "b"], { earlyExit: true })).toEqual([
    "value should not be NaN",
  ]);
});
