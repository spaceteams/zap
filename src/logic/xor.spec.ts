import { array } from "../composite/array";
import { number } from "../simple/number";
import { object } from "../composite/object";
import { defaultValue, optional } from "../utility/optional";
import { xor } from "./xor";
import { string } from "../simple/string";
import { translate } from "../validation";
import { refineAsync } from "../refine";

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

it("validates async", async () => {
  const schema = xor(
    refineAsync(number(), (v, { validIf }) =>
      Promise.resolve(validIf(v < 4, "must be smaller than 4"))
    ),
    refineAsync(number(), (v, { validIf }) =>
      Promise.resolve(validIf(v > 0, "must be positive"))
    )
  );
  expect(await schema.validateAsync(0)).toBeUndefined();
  expect(await schema.validateAsync(4)).toBeUndefined();
  expect(translate(await schema.validateAsync(1))).toEqual("xor");
  expect(translate(await schema.validateAsync(Number.NaN))).toEqual("isNaN");
});

it("parses", () => {
  expect(
    schema.parse({
      nested: { user: "name" },
    }).parsedValue
  ).toEqual({
    description: "default",
    nested: { user: "name" },
  });
  expect(
    translate(
      schema.parse({
        id: 12,
        name: ["some", "string"],
        nested: { user: "3" },
      }).validation
    )
  ).toEqual("xor");
  expect(translate(schema.parse({}).validation)).toEqual({
    nested: "value is required",
  });
});

it("parses async", async () => {
  const schema = xor(
    refineAsync(number(), (v, { validIf }) =>
      Promise.resolve(validIf(v < 4, "must be smaller than 4"))
    ),
    refineAsync(number(), (v, { validIf }) =>
      Promise.resolve(validIf(v > 0, "must be positive"))
    )
  );
  const { parsedValue } = await schema.parseAsync(0);
  expect(parsedValue).toEqual(0);
  const { validation } = await schema.parseAsync(1);
  expect(translate(validation)).toEqual("xor");
  const { validation: validation2 } = await schema.parseAsync(Number.NaN);
  expect(translate(validation2)).toEqual("isNaN");
});

it("builds metadata", () => {
  expect(schema.meta().type).toEqual("xor");
  expect(schema.meta().schemas[0]).toEqual(Named);
  expect(schema.meta().schemas[1]).toEqual(String);
  expect(schema.meta().schemas[2]).toEqual(Described);
});
