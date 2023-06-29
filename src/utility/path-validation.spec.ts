/* eslint-disable unicorn/no-useless-undefined */
/* eslint-disable unicorn/no-null */

import { array, map, object, set } from "../composite";
import { nonNegative, number, string } from "../simple";
import { ValidationIssue, ValidationResult } from "../validation";
import {
  PathValidationResult,
  fromPathValidation,
  toPathValidation,
} from "./path-validation";

const schema = nonNegative(number());
const issue = new ValidationIssue("nonNegative", undefined, -1);

it("handles valid results", () => {
  check(undefined, { validations: [], hints: [] });
});

it("handles primitives", () => {
  const validation = schema.validate({ a: -1 });
  check(validation, { validations: [{ issue, path: "" }], hints: [] });
});

it("handles objects", () => {
  const validation = object({ a: schema }).validate({ a: -1 });
  check(validation, { validations: [{ issue, path: ".a" }], hints: [] });
});

it("handles nested objects", () => {
  const validation = object({
    a: object({ a: schema }),
  }).validate({ a: { a: -1 } });
  check(validation, { validations: [{ issue, path: ".a.a" }], hints: [] });
});

it("handles arrays", () => {
  const validation = array(schema).validate([1, -1]);
  check(validation, { validations: [{ issue, path: "[1]" }], hints: [] });
});

it("handles sets", () => {
  const validation = set(schema).validate(new Set([1, -1]));
  check(validation, {
    validations: [{ issue, path: "[0]" }],
    hints: [{ hint: "Set", path: "" }],
  });
});
it("handles maps", () => {
  const validation = map(string(), schema).validate(new Map([["key", -1]]));
  check(validation, {
    validations: [{ issue, path: "['key']" }],
    hints: [{ hint: "Map", path: "" }],
  });
});

it("handles larger validations objects", () => {
  const validation = {
    a: {
      b: issue,
    },
    c: [issue, { d: issue }],
    m: new Map([
      ["key", issue],
      ["object", { c: issue } as unknown],
    ]),
    d: new Set([issue, { d: issue }]),
  };
  check(validation as unknown as ValidationResult<unknown>, {
    validations: [
      { issue, path: ".a.b" },
      { issue, path: ".c[0]" },
      { issue, path: ".c[1].d" },
      { issue, path: ".m['key']" },
      { issue, path: ".m['object'].c" },
      { issue, path: ".d[0]" },
      { issue, path: ".d[1].d" },
    ],
    hints: [
      { hint: "Map", path: ".m" },
      { hint: "Set", path: ".d" },
    ],
  });
});

function check<T>(
  validation: ValidationResult<T>,
  expected: PathValidationResult
) {
  const path = toPathValidation(validation);
  expect(path).toEqual(expected);
  expect(fromPathValidation(path)).toEqual(validation);
}
