/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { boolean, coercedBoolean } from "./boolean";
import { translate } from "../validation";

it("accepts", () => {
  expect(boolean().accepts(true)).toBeTruthy();

  expect(boolean().accepts(undefined)).toBeFalsy();
  expect(boolean().accepts(null)).toBeFalsy();
});

it("validates", () => {
  expect(boolean().validate(false)).toBeUndefined();
  expect(translate(boolean().validate(undefined))).toEqual("value is required");
});

describe("coercedBoolean", () => {
  it("parses", () => {
    expect(coercedBoolean().parse(-1).parsedValue).toEqual(true);
    expect(coercedBoolean().parse(true).parsedValue).toEqual(true);
    expect(coercedBoolean().parse("a").parsedValue).toEqual(true);

    expect(coercedBoolean().parse(false).parsedValue).toEqual(false);
    expect(coercedBoolean().parse(0).parsedValue).toEqual(false);
    expect(coercedBoolean().parse(0n).parsedValue).toEqual(false);
    expect(coercedBoolean().parse("").parsedValue).toEqual(false);
    expect(coercedBoolean().parse(undefined).parsedValue).toEqual(false);
    expect(coercedBoolean().parse(null).parsedValue).toEqual(false);
    expect(coercedBoolean().parse(Number.NaN).parsedValue).toEqual(false);

    expect(coercedBoolean().parse([]).parsedValue).toEqual(true);
    expect(coercedBoolean().parse([1, "a", 2]).parsedValue).toEqual(true);
    expect(coercedBoolean().parse({}).parsedValue).toEqual(true);
    expect(coercedBoolean().parse(() => false).parsedValue).toEqual(true);
  });
});
