import { array } from "./array";
import { object } from "./object";
import { optional } from "./optional";
import { record } from "./record";
import {
  InferMetaType,
  InferType,
  Schema,
  withMetaInformation,
} from "./schema";
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
  ? Omit<M, "schema"> & {
      schema: WithDeepMetaO<M["schema"], { required: false }>;
    }
  : M extends { schemas: [...Schema<unknown, unknown>[]] }
  ? Omit<M, "schemas"> & {
      schemas: WithDeepMetaT<M["schemas"], { required: false }>;
    }
  : M extends { schema: Schema<unknown, unknown> }
  ? Omit<M, "schema"> & {
      schema: WithDeepMeta<M["schema"], { required: false }>;
    }
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
            schema?: Record<string, Schema<unknown, { type: string }>>;
          }
        ).schema || {}
      )) {
        partialSchema[key] = optional(deepPartial(value));
      }
      const m = { ...meta };
      delete m["schema"];
      return withMetaInformation(
        object(partialSchema),
        m
      ) as unknown as DeepPartialSchema<T, M>;
    }
    case "record": {
      const partialSchema = deepPartial(
        (meta as unknown as { schema: Schema<unknown, { type: string }> })
          .schema
      );
      const m = { ...meta };
      delete m["schema"];
      return withMetaInformation(
        record(optional(partialSchema)),
        m
      ) as unknown as DeepPartialSchema<T, M>;
    }
    case "array": {
      const partialSchema = deepPartial(
        (meta as unknown as { schema: Schema<unknown, { type: string }> })
          .schema
      );
      const m = { ...meta };
      delete m["schema"];
      return withMetaInformation(
        array(optional(partialSchema)),
        m
      ) as unknown as DeepPartialSchema<T, M>;
    }
    case "tuple": {
      const partialSchemas = (
        meta as unknown as { schemas: Schema<unknown, { type: string }>[] }
      ).schemas.map((s) => optional(deepPartial(s)));
      const m = { ...meta };
      delete m["schemas"];
      return withMetaInformation(
        tuple(...partialSchemas),
        m
      ) as unknown as DeepPartialSchema<T, M>;
    }
    default:
      return schema as unknown as DeepPartialSchema<T, M>;
  }
}
