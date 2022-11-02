import { object } from "./composite";
import { refine, refineAsync, validIf } from "./refine";
import { number, string } from "./simple";
import { translate, ValidationIssue } from "./validation";

describe("validIf", () => {
  const schema = validIf(number(), (v) => v % 2 === 0, "even");

  it("adds additional validation", () => {
    expect(schema.validate(12)).toBeUndefined();
    expect(translate(schema.validate(13))).toEqual("even");
  });

  it("adds additional validation ontop of async validation", async () => {
    const asyncSchema = validIf(
      refineAsync(number(), (v, { validIf }) =>
        Promise.resolve(validIf(v > 0, "must be positive"))
      ),
      (v) => v % 2 === 0,
      "even"
    );
    expect(await asyncSchema.validateAsync(12)).toBeUndefined();
    expect(translate(await asyncSchema.validateAsync(-13))).toEqual(
      "must be positive"
    );
    expect(translate(await asyncSchema.validateAsync(13))).toEqual("even");
  });
});

describe("refine", () => {
  const schema = refine(number(), (v) => {
    if (v % 2 !== 0) {
      return new ValidationIssue("generic", "even", v);
    }
  });
  const throwingSchema = refine(number(), (v) => {
    if (v % 2 !== 0) {
      throw new ValidationIssue("generic", "even", v);
    }
  });
  const builderSchema = refine(number(), (v, { add }) => {
    if (v % 2 !== 0) {
      add(new ValidationIssue("generic", "even", v));
    }
  });
  const inlineSchema = refine(object({ a: string() }), (v, { validIf }) => ({
    a: validIf(v.a.length === 0, "a must be empty"),
  }));

  it("adds additional validation", () => {
    expect(schema.validate(12)).toBeUndefined();
    expect(translate(schema.validate(13))).toEqual("even");
    expect(throwingSchema.validate(12)).toBeUndefined();
    expect(translate(throwingSchema.validate(13))).toEqual("even");
  });
  it("only applies after basic validation passes", () => {
    expect(translate(schema.validate(Number.NaN))).toEqual("isNaN");
  });
  it("canonically supports async validation", async () => {
    expect(await schema.validateAsync(12)).toBeUndefined();
    expect(translate(await schema.validateAsync(13))).toEqual("even");
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

describe("refineAsync", () => {
  // eslint-disable-next-line @typescript-eslint/require-await
  const resolveToError = refineAsync(number(), async (v) => {
    if (v % 2 !== 0) {
      return new ValidationIssue("generic", "even", v);
    }
  });
  // eslint-disable-next-line @typescript-eslint/require-await
  const rejectToError = refineAsync(number(), async (v) => {
    if (v % 2 !== 0) {
      throw new ValidationIssue("generic", "even", v);
    }
  });
  // eslint-disable-next-line @typescript-eslint/require-await
  const builderSchema = refineAsync(number(), async (v, { add }) => {
    if (v % 2 !== 0) {
      add(new ValidationIssue("generic", "even", v));
    }
  });
  const inlineSchema = refine(object({ a: string() }), (v, { validIf }) => ({
    a: validIf(v.a.length === 0, "a must be empty"),
  }));

  it("adds additional validation", async () => {
    expect(await resolveToError.validateAsync(12)).toBeUndefined();
    expect(translate(await resolveToError.validateAsync(13))).toEqual("even");
    expect(await rejectToError.validateAsync(12)).toBeUndefined();
    expect(translate(await rejectToError.validateAsync(13))).toEqual("even");
  });
  it("requires async validation", () => {
    expect(translate(resolveToError.validate(12))).toEqual(
      "async_validation_required"
    );
  });
  it("only applies after basic validation passes", async () => {
    expect(translate(await resolveToError.validateAsync(Number.NaN))).toEqual(
      "isNaN"
    );
  });
  it("supports a builder-approach", async () => {
    expect(translate(await builderSchema.validateAsync(13))).toEqual("even");
  });

  it("supports inline-style", async () => {
    expect(translate(await inlineSchema.validateAsync({ a: "a" }))).toEqual({
      a: "a must be empty",
    });
  });

  it("simplifies result", async () => {
    expect(await inlineSchema.validateAsync({ a: "" })).toBeUndefined();
  });
});
