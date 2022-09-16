/* eslint-disable unicorn/no-useless-undefined */

import { array, minItems } from "./array";
import { date } from "./date";
import { number } from "./number";
import { object } from "./object";
import { optional } from "./optional";
import { partial } from "./partial";
import { string } from "./string";
import { tuple } from "./tuple";

const schema = object({
  id: number(),
  name: array(string()),
  description: optional(string()),
  nested: object({
    user: string(),
  }),
});

it("accepts primitives", () => {
  expect(partial(number()).accepts(2)).toBeTruthy();
  expect(partial(number()).accepts(undefined)).toBeFalsy();
});
it("accepts arrays", () => {
  expect(partial(array(number())).accepts([undefined])).toBeTruthy();
});
it("accepts objects", () => {
  expect(partial(schema).accepts({})).toBeTruthy();
});
it("accepts tuples", () => {
  expect(
    partial(tuple(number(), string())).accepts([undefined, ""])
  ).toBeTruthy();
});

it("builds metadata of primitives", () => {
  expect(partial(number()).meta().type).toEqual("number");
});
it("builds metadata of arrays", () => {
  expect(partial(array(number())).meta().schema.meta().required).toEqual(false);
  expect(partial(minItems(array(number()), 2)).meta().minItems).toEqual(2);
});
it("builds metadata of objects", () => {
  expect(partial(schema).meta().schema.id.meta().required).toEqual(false);
  expect(
    partial(schema).meta().schema.nested.meta().schema.user.meta()
  ).toEqual({ type: "string" });
  expect(partial(date()).meta().instance).toEqual("Date");
});
it("builds metadata of tuples", () => {
  expect(
    partial(tuple(number(), string())).meta().schemas[0].meta().required
  ).toEqual(false);
});
