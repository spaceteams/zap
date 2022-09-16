/* eslint-disable unicorn/no-null */

import { array } from "./array";
import { number } from "./number";
import { InferType } from "./schema";
import { at, fromInstance, isInstance, object, omit, pick } from "./object";
import { optional } from "./optional";
import { string } from "./string";
import { translate } from "./validation";

const schema = object({
  id: number(),
  name: array(string()),
  description: optional(string()),
  nested: object({
    user: string(),
  }),
});

class MyObject implements InferType<typeof schema> {
  constructor(
    public readonly id: number,
    public readonly name: string[],
    public readonly nested: {
      user: string;
    }
  ) {}
}

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

  expect(schema.accepts(null)).toBeFalsy();
  expect(
    schema.accepts({ id: 12, name: ["some", "string"], nested: {} })
  ).toBeFalsy();
  expect(
    schema.accepts({ id: "", name: ["some", "string"], nested: {} })
  ).toBeFalsy();
});

it("validates", () => {
  expect(translate(schema.validate(null))).toEqual("value is required");
  expect(translate(schema.validate(1))).toEqual(
    "value was of type number expected object"
  );
});

it("builds metadata", () => {
  expect(schema.meta().type).toEqual("object");
  expect(Object.keys(schema.meta().schema)).toEqual([
    "id",
    "name",
    "description",
    "nested",
  ]);
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

it("parses with stripping", () => {
  expect(
    schema.parse({
      id: 12,
      name: ["first", "last"],
      nested: { user: "some user" },
      additional: "add",
    })
  ).toEqual({
    id: 12,
    name: ["first", "last"],
    nested: { user: "some user" },
  });
  expect(
    schema.parse(
      {
        id: 12,
        name: ["first", "last"],
        nested: { user: "some user" },
        additional: "add",
      },
      { earlyExit: false, strip: false }
    )
  ).toEqual({
    id: 12,
    name: ["first", "last"],
    nested: { user: "some user" },
    additional: "add",
  });
});

describe("isInstance", () => {
  const strictSchema = isInstance(schema, MyObject);
  const instanceSchema = fromInstance(MyObject);

  it("accepts", () => {
    expect(
      strictSchema.accepts(new MyObject(12, [], { user: "12" }))
    ).toBeTruthy();
    expect(
      instanceSchema.accepts(new MyObject(12, [], { user: "12" }))
    ).toBeTruthy();

    expect(
      strictSchema.accepts({ id: 12, name: [], nested: { user: "12" } })
    ).toBeFalsy();
    expect(
      instanceSchema.accepts({ id: 12, name: [], nested: { user: "12" } })
    ).toBeFalsy();
  });
});

describe("omit", () => {
  it("accepts", () => {
    expect(
      omit(schema, "id", "description").accepts({
        id: "",
        name: ["some", "string"],
        nested: { user: "3" },
      })
    ).toBeTruthy();
  });

  it("builds metadata", () => {
    expect(
      Object.keys(omit(schema, "id", "description").meta().schema)
    ).toEqual(["name", "nested"]);
  });
});

describe("pick", () => {
  it("accepts", () => {
    expect(
      pick(schema, "nested").accepts({ id: "", nested: { user: "3" } })
    ).toBeTruthy();
  });

  it("builds metadata", () => {
    expect(Object.keys(pick(schema, "nested").meta().schema)).toEqual([
      "nested",
    ]);
  });
});

describe("at", () => {
  it("accepts", () => {
    expect(at(schema, "nested").accepts({ user: "3" })).toBeTruthy();
    expect(at(schema, "id").accepts(12)).toBeTruthy();
  });

  it("builds metadata", () => {
    expect(at(schema, "id").meta().type).toEqual("number");
  });
});
