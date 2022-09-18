/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { arity, fun } from "./fun";
import { translate } from "../validation";

const lazyString = fun<[], string>();
const binaryPredicate = fun<[string, number], boolean>();

it("accepts", () => {
  expect(lazyString.accepts(() => "")).toBeTruthy();
  expect(binaryPredicate.accepts((_a, _b) => true)).toBeTruthy();

  expect(lazyString.accepts(1)).toBeFalsy();
  expect(lazyString.accepts(null)).toBeFalsy();
  expect(lazyString.accepts(undefined)).toBeFalsy();
});

it("validates", () => {
  expect(binaryPredicate.validate((_a, _b) => true)).toBeUndefined();

  expect(translate(binaryPredicate.validate(1))).toEqual(
    "value was of type number expected function"
  );
});

describe("arity", () => {
  it("validates", () => {
    expect(
      arity(binaryPredicate, 2).validate((_a: number, _b: number) => true)
    ).toBeUndefined();

    expect(
      translate(arity(binaryPredicate, 2).validate((_a, _b, _c) => true))
    ).toEqual("arity(2)");
  });
});
