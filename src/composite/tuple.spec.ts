/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { literal } from "../simple/literal";
import { number } from "../simple/number";
import { defaultValue, optional } from "../utility/optional";
import { tuple } from "./tuple";
import { translate } from "../validation";
import { refineAsync } from "../refine";

const schema = tuple(number(), literal("a"));
schema.meta().schemas[1].meta();
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
    "isNaN",
    "literal(a)",
  ]);
  expect(translate(schema.validate(1))).toEqual(
    "value was of type number expected array"
  );
  expect(translate(schema.validate(null))).toEqual("value is required");
  expect(translate(schema.validate([]))).toEqual("length(2)");
});

it("validates with early exit", () => {
  expect(
    translate(schema.validate([Number.NaN, "b"], { earlyExit: true }))
  ).toEqual(["isNaN"]);
});

it("validates async", async () => {
  const schema = tuple(
    refineAsync(number(), (v, { validIf }) =>
      Promise.resolve(validIf(v > 0, "must be positive"))
    ),
    number()
  );
  expect(await schema.validateAsync([1, -1])).toBeUndefined();

  expect(translate(await schema.validateAsync([0, Number.NaN]))).toEqual([
    "must be positive",
    "isNaN",
  ]);
  expect(
    translate(await schema.validateAsync([0, Number.NaN], { earlyExit: true }))
  ).toEqual(["must be positive"]);
  expect(translate(await schema.validateAsync(null))).toEqual(
    "value is required"
  );
});

it("parses", () => {
  expect(
    tuple(defaultValue(optional(number()), 21), literal("a")).parse([
      undefined,
      "a",
    ]).parsedValue
  ).toEqual([21, "a"]);
});
