/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { translate } from "../validation";
import { nullSchema } from "./null-schema";

describe("nullSchema", () => {
  const schema = nullSchema();

  it("accepts", () => {
    expect(schema.accepts(null)).toBeTruthy();
    expect(schema.accepts(undefined)).toBeFalsy();
  });

  it("validates", () => {
    expect(schema.validate(null)).toBeUndefined();
    expect(translate(schema.validate(undefined))).toEqual(
      "value was of type undefined expected null"
    );
  });

  it("builds meta", () => {
    expect(schema.meta().type).toEqual("null");
  });
});
