import { makeSchema, narrow, Schema } from "../schema";
import { makeIssue, ValidationResult } from "../validation";

export function optional<T, M>(
  schema: Schema<T, M>
): Schema<T | undefined, { required: false } & M> {
  return makeSchema(
    (v) => {
      if (typeof v !== "undefined") {
        return schema.validate(v);
      }
    },
    () => ({ ...schema.meta(), required: false })
  );
}
export function nullable<T, M>(schema: Schema<T, M>): Schema<T | null, M> {
  return makeSchema(
    (v) => {
      if (v !== null) {
        return schema.validate(v);
      }
    },
    () => ({ ...schema.meta() })
  );
}
export function nullish<T, M>(
  schema: Schema<T, M>
): Schema<T | undefined | null, { required: false } & M> {
  return makeSchema(
    (v) => {
      if (typeof v !== "undefined" && v !== null) {
        return schema.validate(v);
      }
    },
    () => ({ ...schema.meta(), required: false })
  );
}

export function required<T, M>(
  schema: Schema<T | undefined | null, M>
): Schema<T, M & { required: true }> {
  type V = ValidationResult<T>;
  return makeSchema(
    (v) => {
      if (typeof v === "undefined" || v === null) {
        return makeIssue("wrong_type", v, "undefined", "null") as V;
      }
      return schema.validate(v) as V;
    },
    () => ({ ...schema.meta(), required: true })
  );
}

export function defaultValue<T, M>(
  schema: Schema<T | undefined | null, M>,
  value: T
): Schema<T, M> {
  return narrow(schema, (v) => v ?? value);
}

export function nullToUndefined<T, M>(
  schema: Schema<T | undefined | null, M>
): Schema<T | undefined, M> {
  return narrow(schema, (v) => v ?? undefined);
}

export function undefinedSchema(): Schema<undefined, { type: "undefined" }> {
  return makeSchema(
    (v) => {
      if (typeof v !== "undefined") {
        return makeIssue("wrong_type", v, "undefined");
      }
    },
    () => ({ type: "undefined" })
  );
}
export function nullSchema(): Schema<null, { type: "null" }> {
  return makeSchema(
    (v) => {
      if (typeof v !== null) {
        return makeIssue("wrong_type", v, "null");
      }
    },
    () => ({ type: "null" })
  );
}
