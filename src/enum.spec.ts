import { nativeEnum } from "./enum";

enum E {
  a,
  b = 12,
  c = "c",
}
const schema = nativeEnum(E);

it("accepts", () => {
  expect(schema.accepts(E.a)).toBeTruthy();
  expect(schema.accepts(E.b)).toBeTruthy();
  expect(schema.accepts(E.c)).toBeTruthy();

  expect(schema.accepts("a")).toBeFalsy();
  expect(schema.accepts(2)).toBeFalsy();
});

it("validates", () => {
  expect(schema.validate(E.a)).toBeUndefined();

  expect(schema.validate("a")).toEqual("value should be a valid enum");
});
