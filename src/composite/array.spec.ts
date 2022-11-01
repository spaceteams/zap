/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import {
  array,
  includes,
  items,
  maxItems,
  minItems,
  nonEmptyArray,
  uniqueItems,
} from "./array";
import { number } from "../simple/number";
import { coerce, refineAsync } from "../schema";
import { translate } from "../validation";

const schema = array(number());
const asyncSchema = refineAsync(array(number()), (v, { validIf }) =>
  Promise.resolve([
    undefined,
    validIf(v[1] > 0, "second field must be positive"),
  ])
);

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
    "isNaN",
  ]);
  expect(translate(schema.validate({}))).toEqual(
    "value was of type object expected array"
  );
});

it("validates async", async () => {
  expect(await asyncSchema.validateAsync([0, 1, -1])).toBeUndefined();
  expect(translate(await asyncSchema.validateAsync([0, 0, "0"]))).toEqual([
    undefined,
    undefined,
    "value was of type string expected number",
  ]);
  expect(translate(await asyncSchema.validateAsync([0, 0, 0]))).toEqual([
    undefined,
    "second field must be positive",
  ]);
  expect(
    translate(
      await asyncSchema.validateAsync([0, "0", undefined], { earlyExit: true })
    )
  ).toEqual([undefined, "value was of type string expected number"]);
  expect(translate(await schema.validateAsync({}))).toEqual(
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
  expect(schema.parse(["1", 1]).parsedValue).toEqual([1, 1]);
});

it("parses async", async () => {
  const { parsedValue } = await asyncSchema.parseAsync([0, 1, -1]);
  expect(parsedValue).toEqual([0, 1, -1]);

  const { validation } = await asyncSchema.parseAsync([0, 0, "0"]);
  expect(translate(validation)).toEqual([
    undefined,
    undefined,
    "value was of type string expected number",
  ]);
});

describe("minItems", () => {
  const schema = minItems(array(number()), 2);
  it("validates", () => {
    expect(schema.validate([1, 2])).toBeUndefined();
    expect(translate(schema.validate([1]))).toEqual("minItems(2)");
  });
});

describe("maxItems", () => {
  const schema = maxItems(array(number()), 2);
  it("validates", () => {
    expect(schema.validate([1, 2])).toBeUndefined();
    expect(translate(schema.validate([1, 2, 3]))).toEqual("maxItems(2)");
  });
});

describe("items", () => {
  const schema = items(array(number()), 2);
  it("validates", () => {
    expect(schema.validate([1, 2])).toBeUndefined();
    expect(translate(schema.validate([1]))).toEqual("items(2)");
    expect(translate(schema.validate([1, 2, 3]))).toEqual("items(2)");
  });
});

describe("uniqueItems", () => {
  const schema = uniqueItems(array(number()));
  it("validates", () => {
    expect(schema.validate([1, 2])).toBeUndefined();
    expect(translate(schema.validate([1, 1]))).toEqual("uniqueItems");
  });
});

describe("includes", () => {
  const schema = includes(array(number()), 2);
  it("validates", () => {
    expect(schema.validate([1, 2])).toBeUndefined();
    expect(translate(schema.validate([1, 1]))).toEqual("includes(2,)");
  });
});

describe("nonEmptyArray", () => {
  const schema = nonEmptyArray(array(number()));
  it("validates", () => {
    expect(schema.validate([1, 2])).toBeUndefined();
    expect(translate(schema.validate([]))).toEqual("minItems(1)");
  });
});
