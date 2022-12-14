/* eslint-disable unicorn/no-null */

import { refineAsync } from "../refine";
import { minLength, pattern, string } from "../simple";
import { number } from "../simple/number";
import { defaultValue, optional } from "../utility/optional";
import { translate } from "../validation";
import { keyedRecord, record } from "./record";

const schema = record(number());
const keyedSchema = keyedRecord(minLength(string(), 3), number());

it("accepts", () => {
  expect(schema.accepts({})).toBeTruthy();
  expect(schema.accepts({ id: 12 })).toBeTruthy();

  expect(schema.accepts(null)).toBeFalsy();
  expect(schema.accepts({ id: 12, name: ["some", "string"] })).toBeFalsy();
});

it("validates", () => {
  expect(schema.validate({ id: 12 })).toBeUndefined();

  expect(
    translate(schema.validate({ id: "", name: ["some", "string"], nested: {} }))
  ).toEqual({
    id: "value was of type string expected number",
    name: "value was of type array expected number",
    nested: "value was of type object expected number",
  });

  expect(
    translate(keyedSchema.validate({ id: 1, name: 2, nested: 3 }))
  ).toEqual({
    id: "invalid_key: minLength(3)",
  });
});

it("validates with early exit", () => {
  const schema = keyedRecord(pattern(string(), /^\d+$/), string());
  expect(
    translate(
      schema.validate(
        { id: "", name: ["some", "string"], nested: {} },
        { earlyExit: true }
      )
    )
  ).toEqual({
    id: "invalid_key: pattern(/^\\d+$/)",
  });
});

it("validates async", async () => {
  const schema = keyedRecord(
    refineAsync(pattern(string(), /^\d+$/), (v, { validIf }) =>
      Promise.resolve(validIf(v.length > 0, "must not be empty"))
    ),
    refineAsync(string(), (v, { validIf }) =>
      Promise.resolve(validIf(v.length > 0, "must not be empty"))
    )
  );
  expect(
    translate(await schema.validateAsync({ 1: "some value" }))
  ).toBeUndefined();

  expect(
    translate(
      await schema.validateAsync({ "not a number": "some value", 2: 2 })
    )
  ).toEqual({
    "2": "value was of type number expected string",
    "not a number": "invalid_key: pattern(/^\\d+$/)",
  });

  expect(
    translate(
      await schema.validateAsync(
        { "not a number": "some value", 2: 2 },
        { earlyExit: true }
      )
    )
  ).toEqual({
    "2": "value was of type number expected string",
  });
  expect(
    translate(
      await schema.validateAsync(
        { "not a number": "some value" },
        { earlyExit: true }
      )
    )
  ).toEqual({
    "not a number": "invalid_key: pattern(/^\\d+$/)",
  });
  expect(translate(await schema.validateAsync(2))).toEqual(
    "value was of type number expected object"
  );
});

it("parses", () => {
  expect(
    record(defaultValue(optional(number()), 42)).parse({
      id: 12,
      missing: undefined,
    }).parsedValue
  ).toEqual({ id: 12, missing: 42 });
});
