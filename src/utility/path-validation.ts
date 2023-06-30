import {
  isValidationIssue,
  ValidationIssue,
  ValidationResult,
} from "../validation";

import { get, set } from "lodash-es";

export interface PathValidation<E = ValidationIssue> {
  path: string;
  issue: E;
}

export interface PathValidationHint {
  path: string;
  hint: "Set" | "Map";
}

export interface PathValidationResult<E = ValidationIssue> {
  validations: PathValidation<E>[];
  hints: PathValidationHint[];
}

function flattenPathValidationResults<E>(
  results: PathValidationResult<E>[]
): PathValidationResult<E> {
  return {
    validations: results.flatMap((r) => r.validations),
    hints: results.flatMap((r) => r.hints),
  };
}

export function toPathValidation<T>(
  validation: ValidationResult<T, ValidationIssue>
): PathValidationResult {
  const { validations, hints } = toPathValidationInner(validation);
  return {
    validations: validations.map(({ path, issue }) => ({
      path: path[0] === "." ? path.slice(1) : path,
      issue,
    })),
    hints: hints.map(({ path, hint }) => ({
      path: path[0] === "." ? path.slice(1) : path,
      hint,
    })),
  };
}

function toPathValidationInner<T>(
  validation: ValidationResult<T, ValidationIssue>,
  path = ""
): PathValidationResult {
  if (isValidationIssue(validation)) {
    return {
      validations: [
        {
          path,
          issue: validation,
        },
      ],
      hints: [],
    };
  }

  // Array
  if (Array.isArray(validation)) {
    return flattenPathValidationResults(
      validation.flatMap((inner, index) =>
        toPathValidationInner(inner, `${path}[${index}]`)
      )
    );
  }

  // Set
  if (validation instanceof Set) {
    const result = flattenPathValidationResults(
      [...validation.values()].flatMap((inner, index) =>
        toPathValidationInner(inner, `${path}[${index}]`)
      )
    );
    return {
      validations: result.validations,
      hints: [...result.hints, { path, hint: "Set" }],
    };
  }

  // Map
  if (validation instanceof Map) {
    const result = flattenPathValidationResults(
      [...validation.keys()].flatMap((key) =>
        toPathValidationInner(validation.get(key), `${path}['${String(key)}']`)
      )
    );
    return {
      validations: result.validations,
      hints: [...result.hints, { path, hint: "Map" }],
    };
  }

  // object
  if (typeof validation === "object") {
    return flattenPathValidationResults(
      Object.keys(validation).flatMap((key) =>
        toPathValidationInner(validation[key], `${path}.${key}`)
      )
    );
  }

  return {
    validations: [],
    hints: [],
  };
}

export function fromPathValidation<T, E = ValidationIssue>(
  validations: PathValidationResult<E>
): ValidationResult<T, E> {
  const result = {};
  for (const { path, issue } of validations.validations) {
    set(result, `root${path === "" ? "" : "."}${path}`, issue);
  }
  for (const { path, hint } of validations.hints) {
    const p = `root${path === "" ? "" : "."}${path}`;
    switch (hint) {
      case "Map": {
        set(result, p, new Map(Object.entries(get(result, p) as object)));
        break;
      }
      case "Set": {
        set(result, p, new Set(get(result, p) as Array<unknown>));
        break;
      }
    }
  }
  return get(result, "root") as ValidationResult<T, E>;
}
