/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { and } from "./and";
import { not } from "./not";
import { integer, number } from "./number";
import { object } from "./object";
import { translate } from "./validation";

const schema = and(
  not(object({ a: integer(number()) })),
  object({ a: number() })
);

it("accepts", () => {
  expect(schema.accepts({ a: 2.1 })).toBeTruthy();
  expect(schema.accepts({ a: 2 })).toBeFalsy();
});

it("validates", () => {
  expect(translate(schema.validate({ a: 2 }))).toEqual(
    "validation failed: not()"
  );
});
