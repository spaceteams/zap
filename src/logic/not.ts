import { makeSchema, Schema } from "../schema";
import { isSuccess, makeIssue } from "../validation";

export function not<I, O, M>(
  schema: Schema<I, O, M>,
  issue?: string
): Schema<unknown, unknown, { type: "not"; schema: Schema<I, O, M> }> {
  return makeSchema(
    (v, o) => {
      if (isSuccess(schema.validate(v, o))) {
        return makeIssue("not", issue, v);
      }
    },
    () => ({
      type: "not",
      schema,
    })
  );
}
