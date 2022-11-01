/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { translate } from "../validation";
import {
  coercedString,
  endsWith,
  length,
  maxLength,
  minLength,
  nonEmptyString,
  pattern,
  startsWith,
  string,
} from "./string";

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

describe("minLength", () => {
  const schema = minLength(string(), 2);
  it("validates", () => {
    expect(schema.validate("12")).toBeUndefined();
    expect(translate(schema.validate("1"))).toEqual("minLength(2)");
  });
});

describe("maxLength", () => {
  const schema = maxLength(string(), 2);
  it("validates", () => {
    expect(schema.validate("12")).toBeUndefined();
    expect(translate(schema.validate("123"))).toEqual("maxLength(2)");
  });
});

describe("minLength", () => {
  const schema = length(string(), 2);
  it("validates", () => {
    expect(schema.validate("12")).toBeUndefined();
    expect(translate(schema.validate("1"))).toEqual("length(2)");
    expect(translate(schema.validate("123"))).toEqual("length(2)");
  });
});

describe("nonEmptyString", () => {
  const schema = nonEmptyString(string());
  it("validates", () => {
    expect(schema.validate("12")).toBeUndefined();
    expect(translate(schema.validate(""))).toEqual("minLength(1)");
  });
});

describe("pattern", () => {
  const schema = pattern(string(), /1/);
  it("validates", () => {
    expect(schema.validate("12")).toBeUndefined();
    expect(translate(schema.validate("2"))).toEqual("pattern(/1/)");
  });
});

describe("startsWith", () => {
  const schema = startsWith(string(), "1");
  it("validates", () => {
    expect(schema.validate("12")).toBeUndefined();
    expect(translate(schema.validate("2"))).toEqual("startsWith(1,)");
  });
});

describe("endsWith", () => {
  const schema = endsWith(string(), "2");
  it("validates", () => {
    expect(schema.validate("12")).toBeUndefined();
    expect(translate(schema.validate("1"))).toEqual("endsWith(2,)");
  });
});
