/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { date, before, after } from "./date";

it("accepts", () => {
  expect(date().accepts(new Date())).toBeTruthy();

  expect(date().accepts(undefined)).toBeFalsy();
  expect(date().accepts(null)).toBeFalsy();
});

it("validates", () => {
  expect(date().validate(new Date())).toBeUndefined();
  expect(date().validate(undefined)).toEqual("value should be a date");
});

describe("before", () => {
  const schema = before(date(), new Date("2022-01-01"));
  it("validates", () => {
    expect(schema.validate(new Date("2021-01-01"))).toBeUndefined();
    expect(schema.validate(new Date("2022-01-01"))).toEqual(
      "value should be before 2022-01-01T00:00:00.000Z"
    );
  });
});

describe("after", () => {
  const schema = after(date(), new Date("2022-01-01"));
  it("validates", () => {
    expect(schema.validate(new Date("2023-01-01"))).toBeUndefined();
    expect(schema.validate(new Date("2022-01-01"))).toEqual(
      "value should be after 2022-01-01T00:00:00.000Z"
    );
  });
});
