/* eslint-disable unicorn/no-useless-undefined */

import { nan, number } from "./simple/number";
import { object } from "./composite/object";
import { undefinedSchema } from "./utility/optional";
import { or } from "./logic/or";
import { coerce, narrow, options, refine, transform, validIf } from "./schema";
import { string } from "./simple/string";
import { makeIssue, translate } from "./validation";

describe("validIf", () => {
  const schema = validIf(number(), (v) => v % 2 === 0, "even");

  it("adds additional validation", () => {
    expect(schema.validate(12)).toBeUndefined();
    expect(translate(schema.validate(13))).toEqual("even");
  });
});

describe("refine", () => {
  const schema = refine(number(), (v) => {
    if (v % 2 !== 0) {
      return makeIssue("generic", "even", v);
    }
  });
  const builderSchema = refine(number(), (v, { add }) => {
    if (v % 2 !== 0) {
      add(makeIssue("generic", "even", v));
    }
  });
  const inlineSchema = refine(object({ a: string() }), (v, { validIf }) => ({
    a: validIf(v.a.length === 0, "a must be empty"),
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

  it("accepts (without coercion)", () => {
    expect(schema.accepts(1)).toBeTruthy();
    expect(schema.accepts("")).toBeFalsy();
    expect(schema.accepts(undefined)).toBeFalsy();
  });
  it("validates", () => {
    expect(schema.validate("", { withCoercion: true })).toBeUndefined();
    expect(
      translate(schema.validate(undefined, { withCoercion: true }))
    ).toEqual("isNaN");
  });
  it("parses", () => {
    expect(schema.parse("").parsedValue).toEqual(0);
    expect(schema.parse("1").parsedValue).toEqual(1);
    expect(
      object({
        nested: schema,
      }).parse({ nested: "1" }).parsedValue
    ).toEqual({ nested: 1 });
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
    expect(schema.parse(12).parsedValue).toEqual(12);
    expect(schema.parse(undefined).parsedValue).toEqual(undefined);
    expect(schema.parse(Number.NaN).parsedValue).toEqual(undefined);
  });
});

describe("transform", () => {
  const transformRefineTransform = transform(
    refine(
      object({
        age: transform(number(), (v) => ({ boxed: v })),
      }),
      (u, { validIf }) => ({
        age: validIf(u.age >= 18, "should be at least 18"),
      })
    ),
    (v) => v.age.boxed
  );

  it("accepts", () => {
    expect(transformRefineTransform.accepts({ age: 21 })).toBeTruthy();
    expect(transformRefineTransform.accepts({ age: 12 })).toBeFalsy();
  });
  it("validates", () => {
    expect(translate(transformRefineTransform.validate({ age: 12 }))).toEqual({
      age: "should be at least 18",
    });
  });
  it("parses", () => {
    expect(transformRefineTransform.parse({ age: 21 }).parsedValue).toEqual(21);
  });
});

describe("options", () => {
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
        // disable strip mode
        a: options(
          object({
            // enable strip mode again
            b: options(object({ c: string() }), { strip: true }),
            // here strip is still disable
            d: object({
              e: number(),
            }),
          }),
          { strip: false }
        ),
      }).parse({
        a: {
          b: { c: "string", add: "inner.inner" },
          d: { e: 1, add: "more" },
          add: "inner",
        },
        add: "outer",
      }).parsedValue
    ).toEqual({
      a: { b: { c: "string" }, d: { e: 1, add: "more" }, add: "inner" },
    });
  });
});
