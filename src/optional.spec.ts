/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { number } from "./number";
import { nullable, nullish, optional } from "./optional";

describe("optional", () => {
  it("accepts", () => {
    expect(optional(number()).accepts(undefined)).toBeTruthy();
    expect(optional(number()).accepts(1)).toBeTruthy();

    expect(optional(number()).accepts(null)).toBeFalsy();
  });

  it("validates", () => {
    expect(optional(number()).validate(undefined)).toBeUndefined();

    expect(optional(number()).validate(null)).toEqual(
      "value should be a number"
    );
  });
});

describe("nullable", () => {
  it("accepts", () => {
    expect(nullable(number()).accepts(1)).toBeTruthy();
    expect(nullable(number()).accepts(null)).toBeTruthy();

    expect(nullable(number()).accepts(undefined)).toBeFalsy();
  });

  it("validates", () => {
    expect(nullable(number()).validate(null)).toBeUndefined();

    expect(nullable(number()).validate(undefined)).toEqual(
      "value should be a number"
    );
  });
});

describe("nullish", () => {
  it("accepts", () => {
    expect(nullish(number()).accepts(undefined)).toBeTruthy();
    expect(nullish(number()).accepts(1)).toBeTruthy();
    expect(nullish(number()).accepts(null)).toBeTruthy();
  });

  it("validates", () => {
    expect(nullish(number()).validate(undefined)).toBeUndefined();
    expect(nullish(number()).validate(null)).toBeUndefined();
  });
});
