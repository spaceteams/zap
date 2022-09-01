/* eslint-disable unicorn/no-useless-undefined */

import { number } from "./number";
import { coerce, refine, transform } from "./schema";

describe("refine", () => {
  const schema = refine(number(), (v) =>
    v % 2 === 0 ? undefined : "value should be an even number"
  );

  it("adds additional validation", () => {
    expect(schema.validate(12)).toBeUndefined();
    expect(schema.validate(13)).toEqual("value should be an even number");
  });
  it("only applies after basic validation passes", () => {
    expect(schema.validate(Number.NaN)).toEqual("value should not be NaN");
  });
});

describe("coerce", () => {
  const schema = coerce(number(), Number);

  it("accepts", () => {
    expect(schema.accepts("")).toBeTruthy();
    expect(schema.accepts(undefined)).toBeFalsy();
  });
  it("validates", () => {
    expect(schema.validate("")).toBeUndefined();
    expect(schema.validate(undefined)).toEqual("value should not be NaN");
  });
  it("parses", () => {
    expect(schema.parse("")).toEqual(0);
    expect(schema.parse("1")).toEqual(1);
  });
});

describe("transform", () => {
  const schema = transform(number(), (v) => ({ user: `user-id-${v}` }));

  it("accepts", () => {
    expect(schema.accepts(1)).toBeTruthy();
    expect(schema.accepts({ user: "user-id-1" })).toBeFalsy();
  });
  it("validates", () => {
    expect(schema.validate(1)).toBeUndefined();
    expect(schema.validate({ user: "user-id-1" })).toEqual(
      "value should be a number"
    );
  });
  it("parses", () => {
    expect(schema.parse(1)).toEqual({ user: "user-id-1" });
  });
});
