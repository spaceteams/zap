/* eslint-disable unicorn/no-null */

import { InferType } from "../schema";
import { number } from "../simple/number";
import { string } from "../simple/string";
import { defaultValue, optional } from "../utility/optional";
import { translate } from "../validation";
import { array } from "./array";
import {
  catchAll,
  fromInstance,
  isInstance,
  keys,
  object,
  omit,
  pick,
  strict,
} from "./object";

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
      nested: { user: "3", additional: true },
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

it("builds metadata", () => {
  expect(schema.meta().type).toEqual("object");
  expect(schema.meta().additionalProperties).toBeTruthy();
  expect(Object.keys(schema.meta().schema)).toEqual([
    "id",
    "name",
    "description",
    "nested",
  ]);
});

it("parses", () => {
  expect(
    object({ a: defaultValue(optional(number()), 12) }).parse({}).parsedValue
  ).toEqual({ a: 12 });
});

it("parses with stripping", () => {
  expect(
    schema.parse({
      id: 12,
      name: ["first", "last"],
      nested: { user: "some user" },
      additional: "add",
    }).parsedValue
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
      { strip: false }
    ).parsedValue
  ).toEqual({
    id: 12,
    name: ["first", "last"],
    nested: { user: "some user" },
    additional: "add",
  });
});

describe("strict", () => {
  it("validates", () => {
    expect(
      translate(
        strict(schema).validate({
          id: 12,
          name: ["first", "last"],
          nested: { user: "some user" },
          additional: "add",
        })
      )
    ).toEqual("additionalProperty(additional)");
  });

  it("builds metadata", () => {
    expect(strict(schema).meta().additionalProperties).toBeFalsy();
  });
});

describe("catchAll", () => {
  const catchAllSchema = catchAll(schema, number());
  it("validates", () => {
    expect(
      translate(
        catchAllSchema.validate({
          id: 12,
          name: ["first", "last"],
          nested: { user: "some user" },
          additional: 32,
        })
      )
    ).toBeUndefined();
    expect(
      translate(
        catchAllSchema.validate({
          id: 12,
          name: ["first", "last"],
          nested: { user: "some user" },
          additional: "add",
        })
      )
    ).toEqual({ additional: "value was of type string expected number" });
  });

  it("builds metadata", () => {
    expect(catchAllSchema.meta().additionalProperties.meta().type).toEqual(
      "number"
    );
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

describe("keys", () => {
  it("accepts", () => {
    expect(keys(schema).accepts("id")).toBeTruthy();
  });

  it("builds metadata", () => {
    expect(keys(schema).meta().type).toEqual("literals");
    expect(keys(schema).meta().literals).toEqual([
      "id",
      "name",
      "description",
      "nested",
    ]);
  });
});
