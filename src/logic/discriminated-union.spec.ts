import { object } from "../composite";
import { literal, number, string } from "../simple";
import { translate } from "../validation";
import { discriminatedUnion } from "./discriminated-union";

const A = object({
  type: literal("a"),
  other: string(),
});
const B = object({
  type: literal("b"),
  another: number(),
});

const schema = discriminatedUnion("type", A, B);

it("accepts", () => {
  expect(
    schema.accepts({
      type: "a",
      other: "some string",
    })
  ).toBeTruthy();
  expect(
    schema.accepts({
      type: "b",
      another: 12,
    })
  ).toBeTruthy();

  expect(
    schema.accepts({
      type: "a",
      other: 12,
    })
  ).toBeFalsy();
  expect(
    schema.accepts({
      type: "c",
      another: 12,
    })
  ).toBeFalsy();
});

it("validates", () => {
  expect(
    schema.validate({
      type: "a",
      other: "some string",
    })
  ).toBeUndefined();
  expect(
    schema.validate({
      type: "b",
      another: 12,
    })
  ).toBeUndefined();

  expect(
    translate(
      schema.validate({
        type: "a",
        other: 12,
      })
    )
  ).toEqual({ other: "value was of type number expected string" });

  expect(
    translate(
      schema.validate({
        type: "c",
        another: 12,
      })
    )
  ).toEqual("unknownDiscrimate(type)");
});

it("parses", () => {
  expect(
    schema.parse({
      type: "a",
      other: "12",
      nested: { user: "3" },
    }).parsedValue
  ).toEqual({
    type: "a",
    other: "12",
  });
  expect(
    translate(
      schema.parse({
        type: "c",
        other: "12",
        nested: { user: "3" },
      }).validation
    )
  ).toEqual("unknownDiscrimate(type)");
});

it("builds metadata", () => {
  expect(schema.meta().type).toEqual("or");
  expect(schema.meta().discrimateKey).toEqual("type");
  expect(schema.meta().schemas[0]).toEqual(A);
  expect(schema.meta().schemas[1]).toEqual(B);
});
