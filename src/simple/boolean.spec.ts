/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { boolean } from "./boolean";
import { translate } from "../validation";

it("accepts", () => {
  expect(boolean().accepts(true)).toBeTruthy();

  expect(boolean().accepts(undefined)).toBeFalsy();
  expect(boolean().accepts(null)).toBeFalsy();
});

it("validates", () => {
  expect(boolean().validate(false)).toBeUndefined();
  expect(translate(boolean().validate(undefined))).toEqual("value is required");
});