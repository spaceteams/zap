/* eslint-disable unicorn/no-useless-undefined */

import { array, minItems } from "../composite/array";
import { number } from "../simple/number";
import { object } from "../composite/object";
import { optional } from "./optional";
import { deepPartial } from "./deep-partial";
import { string } from "../simple/string";
import { tuple } from "../composite/tuple";
import { date } from "../simple/date";

const schema = object({
  id: number(),
  name: array(string()),
  description: optional(string()),
  nested: object({
    user: string(),
  }),
});

it("accepts primitives", () => {
  expect(deepPartial(number()).accepts(2)).toBeTruthy();
  expect(deepPartial(number()).accepts(undefined)).toBeFalsy();
});
it("accepts arrays", () => {
  expect(deepPartial(array(number())).accepts([undefined])).toBeTruthy();
  expect(
    deepPartial(array(array(number()))).accepts([[undefined], undefined])
  ).toBeTruthy();
});
it("accepts objects", () => {
  expect(deepPartial(schema).accepts({})).toBeTruthy();
});
it("accepts tuples", () => {
  expect(
    deepPartial(tuple(tuple(number(), string()), string())).accepts([
      [undefined, ""],
      "",
    ])
  ).toBeTruthy();
});

it("builds metadata of primitives", () => {
  expect(deepPartial(number()).meta().type).toEqual("number");
});
it("builds metadata of arrays", () => {
  expect(deepPartial(array(number())).meta().schema.meta().required).toEqual(
    false
  );
  expect(
    deepPartial(array(array(number())))
      .meta()
      .schema.meta().required
  ).toEqual(false);
  expect(
    deepPartial(array(array(number())))
      .meta()
      .schema.meta()
      .schema.meta().required
  ).toEqual(false);
  expect(deepPartial(minItems(array(number()), 2)).meta().minItems).toEqual(2);
});
it("builds metadata of objects", () => {
  expect(deepPartial(schema).meta().schema.id.meta().required).toEqual(false);
  expect(
    deepPartial(schema).meta().schema.nested.meta().schema.user.meta().required
  ).toEqual(false);
  expect(deepPartial(date()).meta().instance).toEqual("Date");
});
it("builds metadata of tuples", () => {
  expect(
    deepPartial(tuple(number(), string())).meta().schemas[0].meta().required
  ).toEqual(false);
  expect(
    deepPartial(tuple(tuple(number(), number()), string()))
      .meta()
      .schemas[0].meta().required
  ).toEqual(false);
  expect(
    deepPartial(tuple(tuple(number(), number()), string()))
      .meta()
      .schemas[0].meta()
      .schemas[0].meta().required
  ).toEqual(false);
});
