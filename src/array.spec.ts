/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { array } from "./array";
import { number } from "./number";

it("accepts", () => {
  expect(array(number()).accepts([])).toBeTruthy();
  expect(array(number()).accepts([0, 1])).toBeTruthy();

  expect(array(number()).accepts({})).toBeFalsy();
  expect(array(number()).accepts([0, "string"])).toBeFalsy();
  expect(array(number()).accepts([[0]])).toBeFalsy();
  expect(array(number()).accepts([undefined, 1])).toBeFalsy();
});

it("validates", () => {
  expect(array(number()).validate([])).toBeUndefined();
  expect(array(number()).validate([0, "string"])).toEqual([
    undefined,
    "value should be a number",
  ]);
  expect(array(number()).validate({})).toEqual("value should be an array");
});
