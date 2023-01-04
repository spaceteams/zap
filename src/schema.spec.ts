/* eslint-disable unicorn/no-useless-undefined */

import { object } from "./composite/object";
import { or } from "./logic/or";
import { refine } from "./refine";
import { coerce, json, narrow, options, transform } from "./schema";
import { nan, number } from "./simple/number";
import { string } from "./simple/string";
import { undefinedSchema } from "./utility/optional";
import { translate } from "./validation";

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

describe("json", () => {
  it("coerces from json", () => {
    expect(json(number()).parse(JSON.stringify(12)).parsedValue).toEqual(12);
  });
});
