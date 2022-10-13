/* eslint-disable unicorn/no-null */

import { number } from "../simple/number";
import { translate } from "../validation";
import { set } from "./set";

const schema = set(number());

it("accepts", () => {
  expect(schema.accepts(new Set())).toBeTruthy();
  expect(schema.accepts(new Set([1, 2, 3]))).toBeTruthy();

  expect(schema.accepts(null)).toBeFalsy();
  expect(schema.accepts(new Set([1, "2", "3"]))).toBeFalsy();
});

it("validates", () => {
  expect(schema.validate(new Set())).toBeUndefined();
  expect(translate(schema.validate(new Set([1, "2", "3"])))).toEqual(
    // NOTE: the two error messages translate to the same string. And the set collapses!
    new Set(["value was of type string expected number"])
  );
});

it("validates with early exit", () => {
  expect(
    translate(schema.validate(new Set([1, "2", "3"]), { earlyExit: true }))
  ).toEqual(new Set(["value was of type string expected number"]));
});

it("parses", () => {
  expect(schema.parse(new Set([1, 2, 3])).parsedValue).toEqual(
    new Set([1, 2, 3])
  );
});
