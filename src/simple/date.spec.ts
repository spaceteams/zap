/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { date, before, after, coercedDate } from "./date";
import { translate } from "../validation";

it("accepts", () => {
  expect(date().accepts(new Date())).toBeTruthy();

  expect(date().accepts(undefined)).toBeFalsy();
  expect(date().accepts(null)).toBeFalsy();
});

it("validates", () => {
  expect(date().validate(new Date())).toBeUndefined();
  expect(translate(date().validate(new Date("xxx")))).toEqual("invalid_date");
  expect(translate(date().validate(undefined))).toEqual("value is required");
});

describe("before", () => {
  const schema = before(date(), new Date("2022-01-01"));
  it("validates", () => {
    expect(schema.validate(new Date("2021-01-01"))).toBeUndefined();
    expect(translate(schema.validate(new Date("2022-01-01")))).toEqual(
      "before(Sat Jan 01 2022 00:00:00 GMT+0000 (Coordinated Universal Time))"
    );
  });
});

describe("after", () => {
  const schema = after(date(), new Date("2022-01-01"));
  it("validates", () => {
    expect(schema.validate(new Date("2023-01-01"))).toBeUndefined();
    expect(translate(schema.validate(new Date("2022-01-01")))).toEqual(
      "after(Sat Jan 01 2022 00:00:00 GMT+0000 (Coordinated Universal Time))"
    );
  });
});

describe("coercedDate", () => {
  const schema = coercedDate();
  it("validates", () => {
    expect(
      schema.validate("2023-01-01", { withCoercion: true })
    ).toBeUndefined();
  });
  it("parses", () => {
    expect(schema.parse("2023-01-01").parsedValue).toEqual(
      new Date("2023-01-01")
    );
    expect(schema.parse(new Date("2023-01-01")).parsedValue).toEqual(
      new Date("2023-01-01")
    );
  });
});
