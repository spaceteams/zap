import { array, object } from "../composite";
import { Schema } from "../schema";
import { lazy } from "./lazy";
import { optional } from "./optional";

interface Category {
  subCategories?: Category[] | undefined;
}
const schema: Schema<Category, Category, { type: "object" }> = lazy(() =>
  object({
    subCategories: optional(array(schema)),
  })
);

it("accepts", () => {
  expect(schema.accepts({})).toBeTruthy();
  expect(schema.accepts({ subCategories: [] })).toBeTruthy();
  expect(
    schema.accepts({ subCategories: [{ subCategories: [] }, {}] })
  ).toBeTruthy();

  expect(schema.accepts({ subCategories: [1, {}] })).toBeFalsy();
});

it("builds meta", () => {
  expect(schema.meta().type).toEqual("object");
});

it("parse", () => {
  expect(
    schema.parse({ subCategories: [{ subCategories: [] }] }).parsedValue
  ).toEqual({ subCategories: [{ subCategories: [] }] });
});
