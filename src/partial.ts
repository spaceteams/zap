import { array } from "./array";
import { object } from "./object";
import { optional } from "./optional";
import { record } from "./record";
import { InferMetaType, InferType, Schema } from "./schema";
import { tuple } from "./tuple";

type WithMeta<T, M> = Schema<InferType<T>, InferMetaType<T> & M>;
type WithMetaT<T extends [...unknown[]], M> = T extends [
  infer Head,
  ...infer Tail
]
  ? [WithMeta<Head, M>, ...WithMetaT<Tail, M>]
  : [];
type WithMetaO<T, M> = {
  [K in keyof T]: WithMeta<T[K], M>;
};

type PartialSchema<T, M> = Schema<
  Partial<T>,
  M extends { schema: { [key: string]: Schema<unknown, unknown> } }
    ? { schema: WithMetaO<M["schema"], { required: false }> }
    : M extends { schemas: [...Schema<unknown, unknown>[]] }
    ? { schemas: WithMetaT<M["schemas"], { required: false }> }
    : M extends { schema: Schema<unknown, unknown> }
    ? { schema: WithMeta<M["schema"], { required: false }> }
    : M
>;

export function partial<T, M extends { type: string }>(
  schema: Schema<T, M>
): PartialSchema<T, M> {
  const meta = schema.meta();
  switch (meta.type) {
    case "object": {
      const partialSchema = {};
      for (const [key, value] of Object.entries(
        (
          meta as unknown as {
            schema: Record<string, Schema<unknown, unknown>>;
          }
        ).schema
      )) {
        partialSchema[key] = optional(value);
      }
      return object(partialSchema) as unknown as PartialSchema<T, M>;
    }
    case "record":
      return record(
        optional(
          (meta as unknown as { schema: Schema<unknown, unknown> }).schema
        )
      ) as unknown as PartialSchema<T, M>;
    case "array":
      return array(
        optional(
          (meta as unknown as { schema: Schema<unknown, unknown> }).schema
        )
      ) as unknown as PartialSchema<T, M>;
    case "tuple":
      return tuple(
        ...(
          meta as unknown as { schemas: Schema<unknown, unknown>[] }
        ).schemas.map((s) => optional(s))
      ) as unknown as PartialSchema<T, M>;
    default:
      return schema as unknown as PartialSchema<T, M>;
  }
}
