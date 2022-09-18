/* eslint-disable unicorn/no-useless-undefined */

import { literal, literals } from "./literal";
import { translate } from "../validation";

describe("literal", () => {
  const schema = literal("a");

  it("accepts", () => {
    expect(schema.accepts("a")).toBeTruthy();

    expect(schema.accepts("d")).toBeFalsy();
    expect(schema.accepts(undefined)).toBeFalsy();
  });

  it("validates", () => {
    expect(schema.validate("a")).toBeUndefined();

    expect(translate(schema.validate([]))).toEqual(
      "value was of type array expected string or symbol or number"
    );
    expect(translate(schema.validate("d"))).toEqual("literal(a)");
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

    expect(translate(schema.validate([]))).toEqual(
      "value was of type array expected string or symbol or number"
    );
    expect(translate(schema.validate("d"))).toEqual("literal(a,b,c)");
  });
});
