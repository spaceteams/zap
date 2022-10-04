/* eslint-disable unicorn/no-useless-undefined */

import { makeIssue, mergeValidations } from "./validation";

type S = {
  array: string[];
  nestedArray: { field: string }[];
  nestedObject: { field: string };
};
type T = {
  array: string[];
  nestedArray: { field: string }[];
  nestedObject: { field: string; field2: number };
};
const error = makeIssue("additionalProperty", undefined, undefined);

describe("mergeValidations", () => {
  it("returns right if left is success", () => {
    expect(mergeValidations<S, T>(undefined, error)).toEqual(error);
  });
  it("returns left if it is a validation error", () => {
    expect(mergeValidations<S, T>(error, { nestedObject: error })).toEqual(
      error
    );
  });
  it("merges arrays", () => {
    expect(
      mergeValidations<S, T>({ array: [error] }, { array: [error] })
    ).toEqual({ array: [error, error] });
  });
  it("merges objects", () => {
    expect(
      mergeValidations<S, T>({ array: [error] }, { array: [error] })
    ).toEqual({ array: [error, error] });
  });
});
