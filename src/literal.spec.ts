/* eslint-disable unicorn/no-useless-undefined */

import { literal } from "./literal";

it("accepts", () => {
  expect(literal("a").accepts("a")).toBeTruthy();

  expect(literal("a").accepts("b")).toBeFalsy();
  expect(literal("a").accepts(undefined)).toBeFalsy();
});

it("validates", () => {
  expect(literal("a").validate("a")).toBeUndefined();

  expect(literal("a").validate("b")).toEqual("value should literally be a");
});
