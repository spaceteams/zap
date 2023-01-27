/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { refineAsync } from "../refine";
import { coercedDate, string } from "../simple";
import { number } from "../simple/number";
import { translate } from "../validation";
import {
  nullable,
  nullish,
  nullToUndefined,
  optional,
  required,
} from "./optional";

const asyncPositiveNumber = refineAsync(number(), (v, { validIf }) =>
  Promise.resolve(validIf(v > 0, "must be positive"))
);

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

  it("validates async", async () => {
    const schema = optional(asyncPositiveNumber);
    expect(await schema.validateAsync(1)).toBeUndefined();
    expect(await schema.validateAsync(undefined)).toBeUndefined();
    expect(translate(await schema.validateAsync(null))).toEqual(
      "value is required"
    );
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

  it("validates async", async () => {
    const schema = required(optional(asyncPositiveNumber));
    expect(await schema.validateAsync(1)).toBeUndefined();
    expect(translate(await schema.validateAsync(undefined))).toEqual(
      "value is required"
    );
    expect(translate(await schema.validateAsync(null))).toEqual(
      "value is required"
    );
  });

  it("builds meta", () => {
    expect(schema.meta().required).toBeTruthy();
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

  it("validates async", async () => {
    const schema = nullable(asyncPositiveNumber);
    expect(await schema.validateAsync(1)).toBeUndefined();
    expect(await schema.validateAsync(null)).toBeUndefined();
    expect(translate(await schema.validateAsync(undefined))).toEqual(
      "value is required"
    );
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

  it("validates async", async () => {
    const schema = nullish(asyncPositiveNumber);
    expect(await schema.validateAsync(1)).toBeUndefined();
    expect(await schema.validateAsync(null)).toBeUndefined();
    expect(translate(await schema.validateAsync(undefined))).toBeUndefined();
  });

  it("parses", () => {
    expect(nullish(coercedDate()).parse(42).parsedValue).toEqual(new Date(42));
  });

  it("builds meta", () => {
    expect(schema.meta().required).toBeFalsy();
  });
});

describe("nullToUndefined", () => {
  it("coerces", () => {
    const schema = nullToUndefined(nullish(string()));
    expect(schema.parse(null).parsedValue).toEqual(undefined);
  });
});
