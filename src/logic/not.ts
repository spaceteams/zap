import { makeSchema, Schema } from "../schema";
import { isSuccess, ValidationIssue } from "../validation";

export function not<I, O, M>(
  schema: Schema<I, O, M>,
  issue?: string
): Schema<unknown, unknown, { type: "not"; schema: Schema<I, O, M> }> {
  return makeSchema(
    (v, o) => {
      if (isSuccess(schema.validate(v, o))) {
        return new ValidationIssue("not", issue, v);
      }
    },
    async (v, o) => {
      if (isSuccess(await schema.validateAsync(v, o))) {
        return new ValidationIssue("not", issue, v);
      }
    },
    () => ({
      type: "not",
      schema,
    })
  );
}
