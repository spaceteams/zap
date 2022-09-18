import { array, object } from "../composite";
import { lazy } from "./lazy";
import { optional } from "./optional";
import { Schema } from "../schema";

interface Category {
  subCategories?: Category[] | undefined;
}
const schema: Schema<Category, { type: "object" }> = lazy(() =>
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
