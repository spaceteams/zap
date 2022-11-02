/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { and } from "./and";
import { not } from "./not";
import { integer, number } from "../simple/number";
import { object } from "../composite/object";
import { translate } from "../validation";
import { refineAsync } from "../refine";
import { get, into } from "../utility";

const schema = and(
  not(object({ a: integer(number()) })),
  object({ a: number() })
);

it("accepts", () => {
  expect(schema.accepts({ a: 2.1 })).toBeTruthy();
  expect(schema.accepts({ a: 2 })).toBeFalsy();
});

it("validates", () => {
  expect(translate(schema.validate({ a: 2 }))).toEqual("not");
});

it("validates async", async () => {
  const schema = not(
    refineAsync(number(), (v, { validIf }) =>
      Promise.resolve(validIf(v > 0, "must be positive"))
    )
  );
  expect(translate(await schema.validateAsync("not a number"))).toBeUndefined();
  expect(translate(await schema.validateAsync(0))).toBeUndefined();
  expect(translate(await schema.validateAsync(1))).toEqual("not");
});

it("parses (by returning its input)", () => {
  expect(schema.meta().schemas[0].parse({ a: 2.1 }).parsedValue).toEqual({
    a: 2.1,
  });
});

it("creates meta information", () => {
  expect(get(schema, 0).meta().type).toEqual("not");
  expect(into(get(schema, 0)).meta().type).toEqual("object");
});
