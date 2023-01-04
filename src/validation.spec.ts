/* eslint-disable unicorn/no-useless-undefined */

import { mergeValidations, ValidationIssue } from "./validation";

type S = {
  array: string[];
  set: Set<string>;
  map: Map<string, string>;
  nestedArray: { field: string }[];
  nestedObject: { field: string };
};
type T = {
  array: string[];
  set: Set<string>;
  map: Map<string, string>;
  nestedArray: { field: string }[];
  nestedObject: { field: string; field2: number };
};
const error = new ValidationIssue("additionalProperty", undefined, undefined);

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
  it("merges sets", () => {
    expect(
      mergeValidations<S, T>(
        { set: new Set([error]) },
        { set: new Set([error]) }
      )
    ).toEqual({ set: new Set([error, error]) });
  });
  it("merges maps", () => {
    expect(
      mergeValidations<S, T>(
        {
          map: new Map([
            ["1", error],
            ["2", error],
          ]),
        },
        { map: new Map([["2", error]]) }
      )
    ).toEqual({
      map: new Map([
        ["1", error],
        ["2", error],
      ]),
    });
  });
  it("merges objects", () => {
    expect(
      mergeValidations<S, T>({ array: [error] }, { array: [error] })
    ).toEqual({ array: [error, error] });
  });
});
