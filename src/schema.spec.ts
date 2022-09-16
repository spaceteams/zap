/* eslint-disable unicorn/no-useless-undefined */

import { nan, number } from "./number";
import { object } from "./object";
import { undefinedSchema } from "./optional";
import { or } from "./or";
import { coerce, narrow, refine, transform } from "./schema";
import { makeError, translate } from "./validation";

describe("refine", () => {
  const schema = refine(number(), (v) => {
    if (v % 2 !== 0) {
      return makeError("invalid_value", v, "even");
    }
  });

  it("adds additional validation", () => {
    expect(schema.validate(12)).toBeUndefined();
    expect(translate(schema.validate(13))).toEqual("validation failed: even()");
  });
  it("only applies after basic validation passes", () => {
    expect(translate(schema.validate(Number.NaN))).toEqual(
      "validation failed: isNan()"
    );
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
    expect(translate(schema.validate(undefined))).toEqual(
      "validation failed: isNan()"
    );
  });
  it("parses", () => {
    expect(schema.parse("")).toEqual(0);
    expect(schema.parse("1")).toEqual(1);
  });
});

describe("transform", () => {
  const schema = transform(object({ v: number() }), ({ v }) => v);

  it("accepts", () => {
    expect(schema.accepts({ v: 12 })).toBeTruthy();
    expect(schema.accepts(12)).toBeFalsy();
  });
  it("parses", () => {
    expect(schema.parse({ v: 12 })).toEqual(12);
  });
});

describe("narrow", () => {
  const schema = narrow(or(number(), nan(), undefinedSchema()), (v) =>
    Number.isNaN(v) ? undefined : v
  );

  it("accepts", () => {
    expect(schema.accepts(12)).toBeTruthy();
    expect(schema.accepts(Number.NaN)).toBeTruthy();
    expect(schema.accepts(undefined)).toBeTruthy();
  });
  it("parses", () => {
    expect(schema.parse(12)).toEqual(12);
    expect(schema.parse(undefined)).toEqual(undefined);
    expect(schema.parse(Number.NaN)).toEqual(undefined);
  });
});
