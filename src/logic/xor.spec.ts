import { array } from "../composite/array";
import { number } from "../simple/number";
import { object } from "../composite/object";
import { defaultValue, optional } from "../utility/optional";
import { xor } from "./xor";
import { string } from "../simple/string";
import { translate } from "../validation";

const Named = object({
  id: number(),
  name: array(string()),
});
const Described = object({
  description: defaultValue(optional(string()), "default"),
  nested: object({
    user: string(),
  }),
});
const String = string();
const schema = xor(Named, String, Described);

it("accepts", () => {
  expect(
    schema.accepts({
      id: 12,
      name: ["some", "string"],
    })
  ).toBeTruthy();
  expect(
    schema.accepts({
      id: 12,
      name: ["some", "string"],
      additional: true,
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
    })
  ).toBeUndefined();

  expect(
    translate(
      schema.validate({
        id: 12,
        name: ["some", "string"],
        nested: { user: "3" },
      })
    )
  ).toEqual("xor");
  expect(
    translate(schema.validate({ id: "", name: ["some", "string"], nested: {} }))
  ).toEqual({
    nested: { user: "value is required" },
  });
});

it("parses", () => {
  expect(
    schema.parse({
      nested: { user: "name" },
    })
  ).toEqual({
    description: "default",
    nested: { user: "name" },
  });
});

it("builds metadata", () => {
  expect(schema.meta().type).toEqual("xor");
  expect(schema.meta().schemas[0]).toEqual(Named);
  expect(schema.meta().schemas[1]).toEqual(String);
  expect(schema.meta().schemas[2]).toEqual(Described);
});
