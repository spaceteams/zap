import { makeSchema, Schema } from "../schema";
import { isSuccess, makeIssue } from "../validation";

export function not<T, M>(
  schema: Schema<T, M>,
  issue?: string
): Schema<unknown, { type: "not"; schema: Schema<T, M> }> {
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
