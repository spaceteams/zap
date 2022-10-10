/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { and } from "./and";
import { not } from "./not";
import { integer, number } from "../simple/number";
import { object } from "../composite/object";
import { translate } from "../validation";

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

it("parses (by returning its input)", () => {
  expect(schema.meta().schemas[0].parse({ a: 2.1 }).parsedValue).toEqual({
    a: 2.1,
  });
});
