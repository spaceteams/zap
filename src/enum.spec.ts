import { nativeEnum } from "./enum";

enum E {
  a,
  b = 12,
  c = "c",
}
const schema = nativeEnum(E);
const constEnum = nativeEnum({
  a: "a",
  b: 12,
  c: "c",
} as const);

it("accepts", () => {
  expect(schema.accepts(E.a)).toBeTruthy();
  expect(schema.accepts(E.b)).toBeTruthy();
  expect(schema.accepts(E.c)).toBeTruthy();

  expect(constEnum.accepts("a")).toBeTruthy();
  expect(constEnum.accepts(12)).toBeTruthy();
  expect(constEnum.accepts("c")).toBeTruthy();

  expect(schema.accepts(2)).toBeFalsy();
  expect(constEnum.accepts(2)).toBeFalsy();
});

it("validates", () => {
  expect(schema.validate(E.a)).toBeUndefined();

  expect(schema.validate("a")).toEqual("value should be a valid enum");
});
