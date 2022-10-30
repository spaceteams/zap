import { makeSchema, makeSimpleSchema, narrow, Schema } from "../schema";
import { ValidationIssue, ValidationResult } from "../validation";

export function optional<I, O, M>(
  schema: Schema<I, O, M>
): Schema<I | undefined, O | undefined, { required: false } & M> {
  return makeSchema(
    (v, o) => {
      if (typeof v !== "undefined") {
        return schema.validate(v, o);
      }
    },
    async (v, o) => {
      if (typeof v !== "undefined") {
        return schema.validateAsync(v, o);
      }
    },
    () => ({ ...schema.meta(), required: false }),
    (v, o) => schema.parse(v, o).parsedValue
  );
}
export function nullable<I, O, M>(
  schema: Schema<I, O, M>
): Schema<I | null, O | null, M> {
  return makeSchema(
    (v, o) => {
      if (v !== null) {
        return schema.validate(v, o);
      }
    },
    async (v, o) => {
      if (v !== null) {
        return schema.validateAsync(v, o);
      }
    },
    () => ({ ...schema.meta() }),
    (v, o) => {
      const result = v !== null ? schema.parse(v, o).parsedValue : undefined;
      // eslint-disable-next-line unicorn/no-null
      return result ?? null;
    }
  );
}
export function nullish<I, O, M>(
  schema: Schema<I, O, M>
): Schema<I | undefined | null, O | undefined | null, { required: false } & M> {
  return makeSchema(
    (v, o) => {
      if (typeof v !== "undefined" && v !== null) {
        return schema.validate(v, o);
      }
    },
    async (v, o) => {
      if (typeof v !== "undefined" && v !== null) {
        return schema.validateAsync(v, o);
      }
    },
    () => ({ ...schema.meta(), required: false }),
    (v, o) =>
      typeof v !== "undefined" && v !== null
        ? schema.parse(v, o).parsedValue
        : (v as undefined | null)
  );
}

export function required<I, O, M>(
  schema: Schema<I, O, M>,
  issue?: string
): Schema<NonNullable<I>, NonNullable<O>, M & { required: true }> {
  type V = ValidationResult<NonNullable<I>>;
  return makeSchema(
    (v, o) => {
      if (typeof v === "undefined" || v === null) {
        return new ValidationIssue("required", issue, v) as V;
      }
      return schema.validate(v, o);
    },
    async (v, o) => {
      if (typeof v === "undefined" || v === null) {
        return new ValidationIssue("required", issue, v) as V;
      }
      return schema.validateAsync(v, o);
    },
    () => ({ ...schema.meta(), required: true }),
    (v, o) => schema.parse(v, o).parsedValue as NonNullable<O>
  );
}

export function defaultValue<I, O, M>(
  schema: Schema<I, O, M>,
  value: O
): Schema<I, NonNullable<O>, M> {
  return narrow(schema, (v) => (v as NonNullable<O>) ?? value);
}

export function nullToUndefined<I, O, M>(
  schema: Schema<I | undefined | null, O | undefined | null, M>
): Schema<I | undefined | null, O | undefined, M> {
  return narrow(schema, (v) => v ?? undefined);
}

export function undefinedSchema(
  issue?: string
): Schema<undefined, undefined, { type: "undefined" }> {
  return makeSimpleSchema(
    (v) => {
      if (typeof v !== "undefined") {
        return new ValidationIssue("wrong_type", issue, v, "undefined");
      }
    },
    () => ({ type: "undefined" })
  );
}
export function nullSchema(
  issue?: string
): Schema<null, null, { type: "null" }> {
  return makeSimpleSchema(
    (v) => {
      if (typeof v !== null) {
        return new ValidationIssue("wrong_type", issue, v, "null");
      }
    },
    () => ({ type: "null" })
  );
}
