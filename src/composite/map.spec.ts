/* eslint-disable unicorn/no-null */

import { number } from "../simple/number";
import { map } from "./map";
import { translate } from "../validation";
import { string } from "../simple";
import { refineAsync } from "../schema";

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
        new Map([
          [1, 1],
          [2, 2],
        ]),
        { earlyExit: true }
      )
    )
  ).toEqual(
    new Map<number | string, string>([
      [1, "value was of type number expected string"],
    ])
  );
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

it("validates async", async () => {
  const schema = map(
    refineAsync(number(), (v, { validIf }) =>
      Promise.resolve(validIf(v > 0, "must be positive"))
    ),
    refineAsync(string(), (v, { validIf }) =>
      Promise.resolve(validIf(v.length > 0, "must not be empty"))
    )
  );
  expect(await schema.validateAsync(new Map([[1, "1"]]))).toBeUndefined();
  expect(
    translate(
      await schema.validateAsync(
        new Map<unknown, unknown>([
          [1, 1],
          ["2", "2"],
        ])
      )
    )
  ).toEqual(
    new Map<unknown, unknown>([
      [1, "value was of type number expected string"],
      ["2", "invalid_key: value was of type string expected number"],
    ])
  );
  expect(
    translate(
      await schema.validateAsync(
        new Map([
          [1, 1],
          [2, 2],
        ]),
        { earlyExit: true }
      )
    )
  ).toEqual(new Map([[1, "value was of type number expected string"]]));
  expect(
    translate(
      await schema.validateAsync(
        new Map([
          ["1", "1"],
          ["2", "2"],
        ]),
        { earlyExit: true }
      )
    )
  ).toEqual(
    new Map([["1", "invalid_key: value was of type string expected number"]])
  );
  expect(translate(await schema.validateAsync({}))).toEqual(
    "value was of type object expected map"
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
