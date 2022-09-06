/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { array } from "./array";
import { number } from "./number";

const schema = array(number());

it("accepts", () => {
  expect(schema.accepts([])).toBeTruthy();
  expect(schema.accepts([0, 1])).toBeTruthy();

  expect(schema.accepts({})).toBeFalsy();
  expect(schema.accepts([0, "string"])).toBeFalsy();
  expect(schema.accepts([[0]])).toBeFalsy();
  expect(schema.accepts([undefined, 1])).toBeFalsy();
});

it("validates", () => {
  expect(schema.validate([])).toBeUndefined();
  expect(schema.validate([0, "string", Number.NaN])).toEqual([
    undefined,
    "value should be a number",
    "value should not be NaN",
  ]);
  expect(schema.validate({})).toEqual("value should be an array");
});

it("validates with early exit", () => {
  expect(schema.validate([0, "string"], { earlyExit: true })).toEqual([
    undefined,
    "value should be a number",
  ]);
});
