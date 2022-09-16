/* eslint-disable unicorn/no-null */

import { number } from "./number";
import { record } from "./record";
import { translate } from "./validation";

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
    translate(schema.validate({ id: "", name: ["some", "string"], nested: {} }))
  ).toEqual({
    id: "value was of type string expected number",
    name: "value was of type array expected number",
    nested: "value was of type object expected number",
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
