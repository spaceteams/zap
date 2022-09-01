/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { number } from "./number";
import { nullable, nullish, optional } from "./optional";

describe("optional", () => {
  const schema = optional(number());

  it("accepts", () => {
    expect(schema.accepts(undefined)).toBeTruthy();
    expect(schema.accepts(1)).toBeTruthy();

    expect(schema.accepts(null)).toBeFalsy();
  });

  it("validates", () => {
    expect(schema.validate(undefined)).toBeUndefined();

    expect(schema.validate(null)).toEqual("value should be a number");
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

    expect(schema.validate(undefined)).toEqual("value should be a number");
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
