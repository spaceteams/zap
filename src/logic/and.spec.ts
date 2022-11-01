import { and } from "./and";
import { array } from "../composite/array";
import { integer, number } from "../simple/number";
import { object } from "../composite/object";
import { defaultValue, optional } from "../utility/optional";
import { string } from "../simple/string";
import { translate } from "../validation";
import { procedure } from "../utility";
import { refineAsync } from "../schema";

const Named = object({
  id: number(),
  name: array(string()),
  getAge: optional(procedure<[], number>()),
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

it("validates async", async () => {
  const schema = and(
    integer(number()),
    refineAsync(number(), (v, { validIf }) =>
      Promise.resolve(validIf(v > 0, "must be positive"))
    )
  );
  expect(await schema.validateAsync(1)).toBeUndefined();
  expect(translate(await schema.validateAsync(1.2))).toEqual("integer");
  expect(translate(await schema.validateAsync(0))).toEqual("must be positive");
});

it("parses", () => {
  expect(
    schema.parse({
      id: 12,
      name: ["some", "string"],
      nested: { user: "3" },
    }).parsedValue
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
