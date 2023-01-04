/* eslint-disable unicorn/no-useless-undefined */

import { map, record, set } from "../composite";
import { array, minItems } from "../composite/array";
import { object } from "../composite/object";
import { tuple } from "../composite/tuple";
import { date } from "../simple/date";
import { number } from "../simple/number";
import { string } from "../simple/string";
import { optional } from "./optional";
import { partial } from "./partial";

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
  expect(partial(schema).accepts({ a: undefined })).toBeTruthy();
});
it("accepts records", () => {
  expect(partial(record(string())).accepts({})).toBeTruthy();
});
it("accepts sets", () => {
  expect(partial(set(string())).accepts(new Set([undefined, ""]))).toBeTruthy();
});
it("accepts maps", () => {
  expect(
    partial(map(string(), string())).accepts(new Map([["", undefined]]))
  ).toBeTruthy();
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
it("builds metadata of records", () => {
  expect(partial(record(string())).meta().schema.value.meta().required).toEqual(
    false
  );
});
it("builds metadata of sets", () => {
  expect(partial(set(string())).meta().schema.meta().required).toEqual(false);
});
it("builds metadata of maps", () => {
  expect(
    partial(map(string(), string())).meta().schema.value.meta().required
  ).toEqual(false);
});
it("builds metadata of tuples", () => {
  expect(
    partial(tuple(number(), string())).meta().schemas[0].meta().required
  ).toEqual(false);
});
