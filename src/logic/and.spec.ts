import { and } from "./and";
import { array } from "../composite/array";
import { fun } from "../simple/fun";
import { number } from "../simple/number";
import { object } from "../composite/object";
import { defaultValue, optional } from "../utility/optional";
import { string } from "../simple/string";
import { translate } from "../validation";

const Named = object({
  id: number(),
  name: array(string()),
  getAge: optional(fun<[], number>()),
});
const Described = object({
  id: number(),
  description: defaultValue(optional(string()), "defaultValue"),
  nested: object({
    user: string(),
  }),
});
const Empty = object({});
const schema = and(Named, Empty, Described);

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
      nested: { user: "3", additional: true },
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
    translate(schema.validate({ id: "", name: ["some", "string"], nested: {} }))
  ).toEqual({
    id: "value was of type string expected number",
    nested: {
      user: "value is required",
    },
  });
  expect(
    translate(schema.validate({ id: 12, name: ["some", "string"], nested: {} }))
  ).toEqual({
    nested: { user: "value is required" },
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
    schema.parse({
      id: 12,
      name: ["some", "string"],
      nested: { user: "3" },
    })
  ).toEqual({
    id: 12,
    name: ["some", "string"],
    description: "defaultValue",
    nested: { user: "3" },
  });
});

it("builds metadata", () => {
  expect(schema.meta().type).toEqual("and");
  expect(schema.meta().schemas[0]).toEqual(Named);
  expect(schema.meta().schemas[1]).toEqual(Empty);
  expect(schema.meta().schemas[2]).toEqual(Described);
});
