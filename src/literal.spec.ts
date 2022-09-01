/* eslint-disable unicorn/no-useless-undefined */

import { literal } from "./literal";

const schema = literal("a");

it("accepts", () => {
  expect(schema.accepts("a")).toBeTruthy();

  expect(schema.accepts("b")).toBeFalsy();
  expect(schema.accepts(undefined)).toBeFalsy();
});

it("validates", () => {
  expect(schema.validate("a")).toBeUndefined();

  expect(schema.validate("b")).toEqual("value should literally be a");
});
