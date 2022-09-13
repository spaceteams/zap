import { array } from "./array";
import { object } from "./object";
import { optional } from "./optional";
import { record } from "./record";
import { InferMetaType, InferType, Schema } from "./schema";
import { tuple } from "./tuple";

type DeepPartialsT<T extends [...unknown[]]> = T extends [
  infer Head,
  ...infer Tail
]
  ? [DeepPartial<Head>, ...DeepPartialsT<Tail>]
  : T extends Array<unknown>
  ? Partial<T>
  : [];
type DeepPartial<T> = T extends { [key: string]: unknown }
  ? Partial<{ [K in keyof T]: DeepPartial<T[K]> }>
  : T extends [...unknown[]]
  ? Partial<DeepPartialsT<T>>
  : T;

type WithDeepMeta<T, M> = Schema<InferType<T>, DeepMeta<InferMetaType<T>> & M>;
type WithDeepMetaT<T extends [...unknown[]], M> = T extends [
  infer Head,
  ...infer Tail
]
  ? [WithDeepMeta<Head, M>, ...WithDeepMetaT<Tail, M>]
  : [];
type WithDeepMetaO<T, M> = {
  [K in keyof T]: WithDeepMeta<T[K], M>;
};

type DeepMeta<M> = M extends {
  schema: { [key: string]: Schema<unknown, unknown> };
}
  ? { schema: WithDeepMetaO<M["schema"], { required: false }> }
  : M extends { schemas: [...Schema<unknown, unknown>[]] }
  ? { schemas: WithDeepMetaT<M["schemas"], { required: false }> }
  : M extends { schema: Schema<unknown, unknown> }
  ? { schema: WithDeepMeta<M["schema"], { required: false }> }
  : M;

type DeepPartialSchema<T, M> = Schema<DeepPartial<T>, DeepMeta<M>>;

export function deepPartial<T, M extends { type: string }>(
  schema: Schema<T, M>
): DeepPartialSchema<T, M> {
  const meta = schema.meta();
  switch (meta.type) {
    case "object": {
      const partialSchema = {};
      for (const [key, value] of Object.entries(
        (
          meta as unknown as {
            schema: Record<string, Schema<unknown, { type: string }>>;
          }
        ).schema
      )) {
        partialSchema[key] = optional(deepPartial(value));
      }
      return object(partialSchema) as unknown as DeepPartialSchema<T, M>;
    }
    case "record":
      return record(
        optional(
          deepPartial(
            (meta as unknown as { schema: Schema<unknown, { type: string }> })
              .schema
          )
        )
      ) as unknown as DeepPartialSchema<T, M>;
    case "array":
      return array(
        optional(
          deepPartial(
            (meta as unknown as { schema: Schema<unknown, { type: string }> })
              .schema
          )
        )
      ) as unknown as DeepPartialSchema<T, M>;
    case "tuple":
      return tuple(
        ...(
          meta as unknown as { schemas: Schema<unknown, { type: string }>[] }
        ).schemas.map((s) => optional(deepPartial(s)))
      ) as unknown as DeepPartialSchema<T, M>;
    default:
      return schema as unknown as DeepPartialSchema<T, M>;
  }
}
