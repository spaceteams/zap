/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { number } from "../simple/number";
import { nullable, nullish, optional, required } from "./optional";
import { translate } from "../validation";

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
});
