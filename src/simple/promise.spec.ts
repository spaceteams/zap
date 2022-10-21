/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { translate } from "../validation";
import { promise, validatedPromise } from "./promise";
import { string } from "./string";

const stringPromise = promise<string>();

it("accepts", () => {
  expect(stringPromise.accepts(Promise.resolve())).toBeTruthy();

  expect(stringPromise.accepts(1)).toBeFalsy();
  expect(stringPromise.accepts(null)).toBeFalsy();
  expect(stringPromise.accepts(undefined)).toBeFalsy();
});

it("validates", () => {
  expect(stringPromise.validate(Promise.resolve())).toBeUndefined();

  expect(translate(stringPromise.validate(1))).toEqual(
    "value was of type number expected object"
  );
});

describe("validatedPromise", () => {
  const schema = validatedPromise(string(), {
    invalidPromise: "invalid promise",
  });

  it("parses", async () => {
    await expect(
      schema.parse(Promise.resolve("1")).parsedValue
    ).resolves.toEqual("1");
    await expect(
      async () => await schema.parse(Promise.resolve(1)).parsedValue
    ).rejects.toEqual(new Error("invalid promise"));
  });
});
