import { array } from "./array";
import { number } from "./number";
import { object } from "./object";
import { optional } from "./optional";
import { or } from "./or";
import { string } from "./string";
import { translate } from "./validation";

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
const String = string();
const schema = or(Named, String, Described);

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
    translate(schema.validate({ id: "", name: ["some", "string"], nested: {} }))
  ).toEqual({
    id: "value was of type string expected number",
    nested: { user: "value is required" },
  });
});

it("builds metadata", () => {
  expect(schema.meta().type).toEqual("or");
  expect(schema.meta().schemas[0]).toEqual(Named);
  expect(schema.meta().schemas[1]).toEqual(String);
  expect(schema.meta().schemas[2]).toEqual(Described);
});
