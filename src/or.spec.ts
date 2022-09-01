import { array } from "./array";
import { number } from "./number";
import { object } from "./object";
import { optional } from "./optional";
import { or } from "./or";
import { string } from "./string";

const Named = object({
  id: number(),
  name: array(string()),
});
const Described = object({
  id: number(),
  description: optional(string()),
  nested: object({
    user: string(),
  }),
});
const schema = or(Named, Described);

it("accepts", () => {
  expect(
    schema.accepts({
      id: 12,
      name: ["some", "string"],
      nested: { user: "3" },
    })
  ).toBeTruthy();
  expect(
    schema.accepts({
      id: 12,
      name: ["some", "string"],
      nested: { user: "3", additionalFields: true },
    })
  ).toBeTruthy();
  expect(
    schema.accepts({ id: 12, name: ["some", "string"], nested: {} })
  ).toBeTruthy();

  expect(
    schema.accepts({ id: "", name: ["some", "string"], nested: {} })
  ).toBeFalsy();
});

it("validates", () => {
  expect(
    schema.validate({
      id: 12,
      name: ["some", "string"],
      nested: { user: "3" },
    })
  ).toBeUndefined();
  expect(
    schema.validate({ id: 12, name: ["some", "string"], nested: {} })
  ).toBeUndefined();

  expect(
    schema.validate({ id: "", name: ["some", "string"], nested: {} })
  ).toEqual({
    id: "value should be a number",
    nested: { user: "value should be a string" },
  });
});
