/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { array } from "./array";
import { number } from "./number";
import { optional } from "./optional";
import { coerce } from "./schema";
import { translate } from "./validation";

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
  expect(translate(schema.validate([0, "string", Number.NaN]))).toEqual([
    undefined,
    "value was of type string expected number",
    "validation failed: isNan()",
  ]);
  expect(translate(schema.validate({}))).toEqual(
    "value was of type object expected array"
  );
});

it("validates with early exit", () => {
  expect(
    translate(schema.validate([0, "string"], { earlyExit: true }))
  ).toEqual([undefined, "value was of type string expected number"]);
});

it("parses", () => {
  const schema = array(coerce(number(), Number));
  expect(schema.parse(["1", 1])).toEqual([1, 1]);
});
