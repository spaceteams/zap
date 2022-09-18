/* eslint-disable unicorn/no-useless-undefined */

import { nan, number } from "./simple/number";
import { object } from "./composite/object";
import { undefinedSchema } from "./utility/optional";
import { or } from "./logic/or";
import { coerce, narrow, options, refine, transform } from "./schema";
import { string } from "./simple/string";
import { makeGenericIssue, translate } from "./validation";

describe("refine", () => {
  const schema = refine(number(), (v) => {
    if (v % 2 !== 0) {
      return makeGenericIssue("even", v);
    }
  });
  const builderSchema = refine(number(), (v, { add }) => {
    if (v % 2 !== 0) {
      add(makeGenericIssue("even", v));
    }
  });
  const inlineSchema = refine(object({ a: string() }), (v, { issueIf }) => ({
    a: issueIf(v.a.length > 0, "a must be empty"),
  }));

  it("adds additional validation", () => {
    expect(schema.validate(12)).toBeUndefined();
    expect(translate(schema.validate(13))).toEqual("even");
  });
  it("only applies after basic validation passes", () => {
    expect(translate(schema.validate(Number.NaN))).toEqual("isNaN");
  });

  it("supports a builder-approach", () => {
    expect(translate(builderSchema.validate(13))).toEqual("even");
  });

  it("supports inline-style", () => {
    expect(translate(inlineSchema.validate({ a: "a" }))).toEqual({
      a: "a must be empty",
    });
  });

  it("simplifies result", () => {
    expect(inlineSchema.validate({ a: "" })).toBeUndefined();
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
    expect(translate(schema.validate(undefined))).toEqual("isNaN");
  });
  it("parses", () => {
    expect(schema.parse("")).toEqual(0);
    expect(schema.parse("1")).toEqual(1);
    expect(
      object({
        nested: schema,
      }).parse({ nested: "1" })
    ).toEqual({ nested: 1 });
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

describe("options", () => {
  it("sets strict", () => {
    expect(
      translate(
        object({
          outer: options(object({ a: string() }), { strict: true }),
        }).validate({
          outer: { a: "", add: "inner" },
          add: "outer",
        })
      )
    ).toEqual({ outer: "additionalField(add)" });
  });
  it("sets earlyExit", () => {
    expect(
      translate(
        object({
          outer: options(object({ a: string(), b: string() }), {
            earlyExit: true,
          }),
          second: number(),
        }).validate({
          outer: {
            a: 1,
            b: 2,
          },
        })
      )
    ).toEqual({
      outer: { a: "value was of type number expected string" },
      second: "value is required",
    });
  });
  it("sets strip", () => {
    expect(
      object({
        a: options(object({ b: string() }), { strip: false }),
      }).parse({
        a: { b: "", add: "inner" },
        add: "outer",
      })
    ).toEqual({ a: { b: "", add: "inner" } });
  });
});
