import { and, or } from "../logic";
import { array, object, strict, tuple } from "../composite";
import {
  boolean,
  literal,
  literals,
  exclusiveMaximum,
  exclusiveMinimum,
  integer,
  maximum,
  minimum,
  multipleOf,
  nan,
  string,
  number,
} from "../simple";
import { nullable, nullSchema, optional } from "./optional";
import { toJsonSchema } from "./to-json-schema";

it("renders header", () => {
  expect(
    toJsonSchema(string(), {
      title: "title",
      $id: "$id",
      description: "description",
    })
  ).toEqual({
    $id: "$id",
    $schema: "https://json-schema.org/draft/2020-12/schema",
    description: "description",
    title: "title",
    type: "string",
  });
});

it("translates types", () => {
  expect(toJsonSchema(nullSchema())).toEqual({ type: "null" });
  expect(toJsonSchema(number())).toEqual({ type: "number" });
  expect(toJsonSchema(boolean())).toEqual({ type: "boolean" });
  expect(toJsonSchema(number())).toEqual({ type: "number" });
  expect(toJsonSchema(string())).toEqual({ type: "string" });

  expect(toJsonSchema(integer(number()))).toEqual({ type: "integer" });
  expect(toJsonSchema(nan())).toEqual({ type: "number" });

  expect(toJsonSchema(object({}))).toMatchObject({ type: "object" });
  expect(toJsonSchema(array(string()))).toMatchObject({ type: "array" });
  expect(toJsonSchema(tuple(string()))).toMatchObject({ type: "array" });

  expect(toJsonSchema(literal("a"))).toEqual({ const: "a" });
  expect(toJsonSchema(literals("a", 2))).toMatchObject({ enum: ["a", 2] });
});

describe("number", () => {
  it("translates validations", () => {
    const veryRefinedNumber = multipleOf(
      exclusiveMaximum(
        maximum(exclusiveMinimum(minimum(number(), 1), 2), 3),
        4
      ),
      5
    );
    expect(toJsonSchema(veryRefinedNumber)).toEqual({
      type: "number",
      minimum: 1,
      exclusiveMinimum: 2,
      maximum: 3,
      exclusiveMaximum: 4,
      multipleOf: 5,
    });
  });
});

describe("array", () => {
  it("translates items", () => {
    expect(toJsonSchema(array(string()))).toMatchObject({
      items: {
        type: "string",
      },
    });
  });
});

describe("object", () => {
  it("translates properties", () => {
    expect(
      toJsonSchema(
        object({
          a: string(),
        })
      )
    ).toMatchObject({
      properties: {
        a: { type: "string" },
      },
    });
  });

  it("translates required", () => {
    expect(
      toJsonSchema(
        object({
          a: string(),
          b: optional(string()),
          c: nullable(string()),
        })
      )
    ).toMatchObject({
      required: ["a", "c"],
    });
  });

  it("translates additionalProperties", () => {
    expect(toJsonSchema(object({}))).toMatchObject({
      additionalProperties: true,
    });
    expect(toJsonSchema(strict(object({})))).toMatchObject({
      additionalProperties: false,
    });
  });
});

describe("tuple", () => {
  it("translates items", () => {
    expect(toJsonSchema(tuple(string(), number()))).toMatchObject({
      items: false,
    });
  });
  it("translates prefixItems", () => {
    expect(toJsonSchema(tuple(string(), number()))).toMatchObject({
      prefixItems: [{ type: "string" }, { type: "number" }],
    });
  });
});

describe("or", () => {
  it("translates items", () => {
    expect(toJsonSchema(or(string(), number()))).toMatchObject({
      anyOf: [{ type: "string" }, { type: "number" }],
    });
  });
});

describe("and", () => {
  it("translates items", () => {
    expect(toJsonSchema(and(string(), number()))).toMatchObject({
      allOf: [{ type: "string" }, { type: "number" }],
    });
  });
});
