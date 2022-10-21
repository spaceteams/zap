/* eslint-disable unicorn/no-null */

import { number } from "../simple/number";
import { defaultValue, optional } from "../utility/optional";
import { keyedRecord, record } from "./record";
import { translate } from "../validation";
import { minLength, string } from "../simple";

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
  expect(
    translate(
      schema.validate(
        { id: "", name: ["some", "string"], nested: {} },
        { earlyExit: true }
      )
    )
  ).toEqual({
    id: "value was of type string expected number",
  });
});

it("parses", () => {
  expect(
    record(defaultValue(optional(number()), 42)).parse({
      id: 12,
      missing: undefined,
    }).parsedValue
  ).toEqual({ id: 12, missing: 42 });
});
