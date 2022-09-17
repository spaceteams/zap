/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { literal } from "./literal";
import { number } from "./number";
import { defaultValue, optional } from "./optional";
import { tuple } from "./tuple";
import { translate } from "./validation";

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

  expect(translate(schema.validate([Number.NaN, "b"]))).toEqual([
    "validation failed: isNaN()",
    "validation failed: literal(a)",
  ]);
  expect(translate(schema.validate(null))).toEqual("value is required");
  expect(translate(schema.validate([]))).toEqual(
    "validation failed: length(2)"
  );
});
it("validates with early exit", () => {
  expect(
    translate(schema.validate([Number.NaN, "b"], { earlyExit: true }))
  ).toEqual(["validation failed: isNaN()"]);
});

it("parses", () => {
  expect(
    tuple(defaultValue(optional(number()), 21), literal("a")).parse([
      undefined,
      "a",
    ])
  ).toEqual([21, "a"]);
});
