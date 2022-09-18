/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { string } from "./string";

it("accepts", () => {
  expect(string().accepts("")).toBeTruthy();

  expect(string().accepts(undefined)).toBeFalsy();
  expect(string().accepts(null)).toBeFalsy();
});

it("validates", () => {
  expect(string().validate("")).toBeUndefined();
  expect(string().validate(undefined)).toMatchObject({
    message: "wrong_type",
    value: undefined,
    args: ["string"],
  });
});
