/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { arity, Procedure, procedure, validatedProcedure } from "./procedure";
import { translate } from "../validation";
import { tuple } from "../composite";
import { string } from "./string";
import { number } from "./number";
import { boolean } from "./boolean";

const lazyString = procedure<[], string>();
const binaryPredicate = procedure<[string, number], boolean>();

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

describe("validatedProcedure", () => {
  const validated = validatedProcedure(tuple(string(), number()), boolean(), {
    invalidReturn: "invalid return",
    invalidArguments: "invalid arguments",
  });

  it("validates", () => {
    expect(validated.validate((_a, _b) => true)).toBeUndefined();

    expect(translate(validated.validate(1))).toEqual(
      "value was of type number expected function"
    );
  });

  it("parses", () => {
    const v = validated.parse((a: string, b: number, _c?: string) =>
      a.length > b ? true : 1
    ).parsedValue;

    expect(v).toBeDefined();

    if (v) {
      expect(v("ok", 1)).toEqual(true);
      expect(() => v("ko", 3)).toThrowError("invalid return");
      expect(() =>
        (v as unknown as Procedure<[string], void>)("ko")
      ).toThrowError("invalid arguments");
    }
  });
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
