import { Schema, ValidationOptions } from "../schema";
import { isSuccess, ValidationIssue, ValidationResult } from "../validation";

export function async<T>(
  validateAsync: (
    v: unknown,
    options?: Partial<ValidationOptions>
  ) => Promise<ValidationResult<T>>
): Schema<T, T, { type: "async" }> {
  const validate: Schema<T, T, { type: "async" }>["validate"] = (v) =>
    new ValidationIssue(
      "async_validation_required",
      undefined,
      v
    ) as ValidationResult<T>;
  return {
    accepts: (v): v is T => false,
    parse: (v) => ({ validation: validate(v) }),
    parseAsync: async (v, o) => {
      const validation = await validateAsync(v, o);
      if (isSuccess(validation)) {
        return { parsedValue: v as T };
      }
      return { validation };
    },
    validate,
    validateAsync,
    meta: () => ({ type: "async" }),
  };
}
