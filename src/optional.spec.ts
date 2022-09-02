/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { number } from "./number";
import { defaultValue, nullable, nullish, optional } from "./optional";

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

describe("defaultValue", () => {
  const schema = defaultValue(optional(number()), 42);

  it("parses", () => {
    expect(schema.parse(1)).toEqual(1);
    expect(schema.parse(undefined)).toEqual(42);
    expect(() => schema.parse(null)).toThrow();
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
