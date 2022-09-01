/* eslint-disable unicorn/no-null */

import { number } from "./number";
import { record } from "./record";

const schema = record(number());

it("accepts", () => {
  expect(schema.accepts({})).toBeTruthy();
  expect(schema.accepts({ id: 12 })).toBeTruthy();

  expect(schema.accepts(null)).toBeFalsy();
  expect(schema.accepts({ id: 12, name: ["some", "string"] })).toBeFalsy();
});

it("validates", () => {
  expect(schema.validate({ id: 12 })).toBeUndefined();

  expect(
    schema.validate({ id: "", name: ["some", "string"], nested: {} })
  ).toEqual({
    id: "value should be a number",
    name: "value should be a number",
    nested: "value should be a number",
  });
});
