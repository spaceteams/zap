import { array } from "../composite/array";
import { number } from "../simple/number";
import { object } from "../composite/object";
import { optional } from "../utility/optional";
import { or } from "./or";
import { string } from "../simple/string";
import { translate } from "../validation";

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

it("parses", () => {
  expect(
    schema.parse({
      id: 12,
      name: ["some", "string"],
      nested: { user: "3" },
    })
  ).toEqual({
    id: 12,
    name: ["some", "string"],
  });
});

it("builds metadata", () => {
  expect(schema.meta().type).toEqual("or");
  expect(schema.meta().schemas[0]).toEqual(Named);
  expect(schema.meta().schemas[1]).toEqual(String);
  expect(schema.meta().schemas[2]).toEqual(Described);
});
