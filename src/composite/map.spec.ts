/* eslint-disable unicorn/no-null */

import { number } from "../simple/number";
import { map } from "./map";
import { translate } from "../validation";
import { string } from "../simple";

const schema = map(number(), string());

it("accepts", () => {
  expect(schema.accepts(new Map())).toBeTruthy();
  expect(
    schema.accepts(
      new Map([
        [1, "1"],
        [2, "2"],
      ])
    )
  ).toBeTruthy();

  expect(schema.accepts(null)).toBeFalsy();
  expect(
    schema.accepts(
      new Map([
        ["1", "1"],
        ["2", "2"],
      ])
    )
  ).toBeFalsy();
});

it("validates", () => {
  expect(schema.validate(new Map())).toBeUndefined();

  expect(
    translate(
      schema.validate(
        new Map<unknown, unknown>([
          ["1", "1"],
          [2, 2],
        ])
      )
    )
  ).toEqual(
    new Map<number | string, string>([
      ["1", "invalid_key: value was of type string expected number"],
      [2, "value was of type number expected string"],
    ])
  );
});

it("validates with early exit", () => {
  expect(
    translate(
      schema.validate(
        new Map<unknown, unknown>([
          ["1", "1"],
          [2, 2],
        ]),
        { earlyExit: true }
      )
    )
  ).toEqual(
    new Map<number | string, string>([
      ["1", "invalid_key: value was of type string expected number"],
    ])
  );
});

it("parses", () => {
  expect(
    schema.parse(
      new Map([
        [1, "1"],
        [2, "2"],
      ])
    ).parsedValue
  ).toEqual(
    new Map([
      [1, "1"],
      [2, "2"],
    ])
  );
});
