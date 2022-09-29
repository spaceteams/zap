/* eslint-disable unicorn/no-useless-undefined */

import { nan, number } from "./simple/number";
import { object } from "./composite/object";
import { optional, undefinedSchema } from "./utility/optional";
import { or } from "./logic/or";
import { coerce, narrow, options, refine, RefineContext } from "./schema";
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

  it("allows for type narrowing", () => {
    const innerSchema = object({
      a: optional(number()),
      b: string(),
    });
    const typeNarrowed = refine(
      innerSchema,
      (v, ctx: RefineContext<{ a: number; b: string }>) => {
        if (!v.a) {
          ctx.add({ b: makeGenericIssue("some_problem", v) });
        }
      }
    );
    expect(translate(typeNarrowed.validate({ b: "hello" }))).toEqual({
      b: "some_problem",
    });
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
      })
    ).toEqual({
      a: { b: { c: "string" }, d: { e: 1, add: "more" }, add: "inner" },
    });
  });
});
