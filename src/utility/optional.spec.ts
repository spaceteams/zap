/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { number } from "../simple/number";
import { nullable, nullish, optional, required } from "./optional";
import { translate } from "../validation";
import { coercedDate } from "../simple";

describe("optional", () => {
  const schema = optional(number());

  it("accepts", () => {
    expect(schema.accepts(undefined)).toBeTruthy();
    expect(schema.accepts(1)).toBeTruthy();

    expect(schema.accepts(null)).toBeFalsy();
  });

  it("validates", () => {
    expect(schema.validate(undefined)).toBeUndefined();

    expect(translate(schema.validate(null))).toEqual("value is required");
  });

  it("parses", () => {
    expect(optional(coercedDate()).parse(42).parsedValue).toEqual(new Date(42));
  });
});

describe("required", () => {
  const schema = required(optional(number()));

  it("accepts", () => {
    expect(schema.accepts(1)).toBeTruthy();

    expect(schema.accepts(undefined)).toBeFalsy();
    expect(schema.accepts(null)).toBeFalsy();
  });

  it("validates", () => {
    expect(translate(schema.validate(undefined))).toEqual("value is required");
    expect(translate(schema.validate(null))).toEqual("value is required");
  });

  it("parses", () => {
    expect(required(optional(coercedDate())).parse(42).parsedValue).toEqual(
      new Date(42)
    );
  });
});

describe("nullable", () => {
  const schema = nullable(number());

  it("accepts", () => {
    expect(schema.accepts(1)).toBeTruthy();
    expect(schema.accepts(null)).toBeTruthy();

    expect(schema.accepts(undefined)).toBeFalsy();
  });

  it("validates", () => {
    expect(schema.validate(null)).toBeUndefined();

    expect(translate(schema.validate(undefined))).toEqual("value is required");
  });

  it("parses", () => {
    expect(nullable(coercedDate()).parse(42).parsedValue).toEqual(new Date(42));
  });
});

describe("nullish", () => {
  const schema = nullish(number());

  it("accepts", () => {
    expect(schema.accepts(undefined)).toBeTruthy();
    expect(schema.accepts(1)).toBeTruthy();
    expect(schema.accepts(null)).toBeTruthy();
  });

  it("validates", () => {
    expect(schema.validate(undefined)).toBeUndefined();
    expect(schema.validate(null)).toBeUndefined();
  });

  it("parses", () => {
    expect(nullish(coercedDate()).parse(42).parsedValue).toEqual(new Date(42));
  });
});
