/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { coercedString, string } from "./string";

it("accepts", () => {
  expect(string().accepts("")).toBeTruthy();

  expect(string().accepts(undefined)).toBeFalsy();
  expect(string().accepts(null)).toBeFalsy();
});

it("validates", () => {
  expect(string().validate("")).toBeUndefined();
  expect(string({ required: "message" }).validate(undefined)).toMatchObject({
    message: "message",
    code: "required",
    value: undefined,
  });
});

describe("coercedString", () => {
  it("parses", () => {
    expect(coercedString().parse("a").parsedValue).toEqual("a");
    expect(coercedString().parse(undefined).parsedValue).toEqual("undefined");
    expect(coercedString().parse(true).parsedValue).toEqual("true");
    expect(coercedString().parse(false).parsedValue).toEqual("false");
    expect(coercedString().parse(null).parsedValue).toEqual("null");
    expect(coercedString().parse([1, "a", 2]).parsedValue).toEqual("1,a,2");
    expect(coercedString().parse({}).parsedValue).toEqual("[object Object]");
    expect(coercedString().parse(() => 1).parsedValue).toEqual("() => 1");
  });
});
