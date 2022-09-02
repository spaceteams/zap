/* eslint-disable unicorn/no-null */

import { array } from "./array";
import { number } from "./number";
import { InferType } from "./schema";
import { at, fromInstance, isInstance, object, omit, pick } from "./object";
import { optional } from "./optional";
import { string } from "./string";

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
    nested: { user: "value should be a string" },
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
});

describe("pick", () => {
  it("accepts", () => {
    expect(
      pick(schema, "nested").accepts({ id: "", nested: { user: "3" } })
    ).toBeTruthy();
  });
});

describe("at", () => {
  it("accepts", () => {
    expect(at(schema, "nested").accepts({ user: "3" })).toBeTruthy();
  });
});
