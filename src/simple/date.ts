import { fromInstance } from "../composite/object";
import { coerce, refine, refineWithMetainformation, Schema } from "../schema";
import { makeIssue } from "../validation";

export function date(
  issues?: Partial<{
    required: string;
    wrongType: string;
    isNan: string;
  }>
): Schema<Date, Date, { type: "object"; instance: string }> {
  return refine(fromInstance(Date, issues), (d) => {
    if (Number.isNaN(d)) {
      return makeIssue("isNaN", issues?.isNan, d);
    }
  });
}

export function coercedDate(
  issues?: Partial<{
    required: string;
    wrongType: string;
    isNan: string;
  }>
): Schema<Date, Date, { type: "object"; instance: string }> {
  return coerce(date(issues), (v) => {
    if (typeof v === "string" || typeof v === "number") {
      return new Date(v);
    }
    return v;
  });
}

export function before<O, M>(
  schema: Schema<Date, O, M>,
  value: Date,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v >= value) {
        return makeIssue("before", issue, v, value);
      }
    },
    { max: value }
  );
}
export function after<O, M>(
  schema: Schema<Date, O, M>,
  value: Date,
  issue?: string
) {
  return refineWithMetainformation(
    schema,
    (v) => {
      if (v <= value) {
        return makeIssue("after", issue, v, value);
      }
    },
    { min: value }
  );
}
