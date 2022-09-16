/* eslint-disable unicorn/no-useless-undefined */

import { literal, literals } from "./literal";

describe("literal", () => {
  const schema = literal("a");

  it("accepts", () => {
    expect(schema.accepts("a")).toBeTruthy();

    expect(schema.accepts("d")).toBeFalsy();
    expect(schema.accepts(undefined)).toBeFalsy();
  });

  it("validates", () => {
    expect(schema.validate("a")).toBeUndefined();

    expect(schema.validate([])).toEqual("value is not a literal");
    expect(schema.validate("d")).toEqual("value should literally be a");
  });
});

describe("literals", () => {
  const schema = literals("a", "b", "c");
  it("accepts", () => {
    expect(schema.accepts("a")).toBeTruthy();

    expect(schema.accepts("d")).toBeFalsy();
    expect(schema.accepts(undefined)).toBeFalsy();
  });
  it("validates", () => {
    expect(schema.validate("a")).toBeUndefined();

    expect(schema.validate([])).toEqual("value is not a literal");
    expect(schema.validate("d")).toEqual(
      "value should literally be one of [a,b,c]"
    );
  });
});
