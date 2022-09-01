import { and } from "./and";
import { array } from "./array";
import { fun } from "./fun";
import { number } from "./number";
import { object } from "./object";
import { optional } from "./optional";
import { string } from "./string";

const Named = object({
  id: number(),
  name: array(string()),
  getAge: optional(fun<[], number>()),
});
const Described = object({
  id: number(),
  description: optional(string()),
  nested: object({
    user: string(),
  }),
});
const schema = and(Named, Described);

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
  ).toBeFalsy();
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
    schema.validate({ id: "", name: ["some", "string"], nested: {} })
  ).toEqual({
    id: "value should be a number",
    nested: {
      user: "value should be a string",
    },
  });
  expect(
    schema.validate({ id: 12, name: ["some", "string"], nested: {} })
  ).toEqual({
    nested: { user: "value should be a string" },
  });
});
