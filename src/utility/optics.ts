import { Schema } from "../schema";

export type Focusable = { schema: unknown } | { schemas: unknown[] };
export type Focus<M> = M extends { schema: infer T }
  ? T
  : M extends { schemas: infer T }
  ? T
  : never;

export function into<M extends Focusable>(schema: Schema<unknown, unknown, M>) {
  const meta = schema.meta();
  return (meta["schema"] ?? meta["schemas"]) as Focus<M>;
}

export function get<M extends Focusable, K extends keyof Focus<M>>(
  schema: Schema<unknown, unknown, M>,
  key: K
): Focus<M>[K] {
  return into(schema)[key];
}
