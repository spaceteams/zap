import { array } from "./array";
import { lazy } from "./lazy";
import { object } from "./object";
import { optional } from "./optional";
import { Schema } from "./schema";

interface Category {
  subCategories: Category[] | undefined;
}
const schema: Schema<Category> = lazy(() =>
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
