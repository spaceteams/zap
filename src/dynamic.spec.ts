import { and } from "./and";
import { array } from "./array";
import { boolean } from "./boolean";
import { fun } from "./fun";
import { literal } from "./literal";
import { number } from "./number";
import { object } from "./object";
import { optional } from "./optional";
import { refine } from "./schema";
import { string } from "./string";

const Named = object({
  id: number(),
  name: array(string()),
  getAge: optional(fun<[], number>()),
});
const andSchema = and(Named, (v) => {
  const age = v.getAge ? v.getAge() : 0;
  return object({
    isAdult: literal(age >= 21),
  });
});

it("can be done with and", () => {
  expect(
    andSchema.validate({
      id: 1,
      name: ["billy", "b"],
      getAge: () => 12,
      isAdult: false,
    })
  ).toBeUndefined();
  expect(
    andSchema.validate({
      id: 1,
      name: ["john", "j"],
      getAge: () => 21,
      isAdult: true,
    })
  ).toBeUndefined();
  expect(
    andSchema.validate({
      id: 1,
      name: ["billy", "b"],
      isAdult: true,
    })
  ).toEqual({ isAdult: "value should literally be false" });
});

const refineSchema = refine(and(Named, object({ isAdult: boolean() })), (v) => {
  const age = v.getAge ? v.getAge() : 0;
  if (age < 21 && v.isAdult) {
    return { isAdult: "you are not old enough" };
  }
});
it("can be done with refine", () => {
  expect(
    refineSchema.validate({
      id: 1,
      name: ["billy", "b"],
      getAge: () => 12,
      isAdult: false,
    })
  ).toBeUndefined();
  expect(
    refineSchema.validate({
      id: 1,
      name: ["billy", "b"],
      isAdult: true,
    })
  ).toEqual({ isAdult: "you are not old enough" });
});
