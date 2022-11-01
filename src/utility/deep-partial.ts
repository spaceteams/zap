import { array, keyedRecord, map, object, set, tuple } from "../composite";
import { optional } from "./optional";
import {
  InferMetaType,
  InferOutputType,
  InferType,
  Schema,
  withMetaInformation,
} from "../schema";

type DeepPartialsT<T extends [...unknown[]]> = T extends [
  infer Head,
  ...infer Tail
]
  ? [DeepPartial<Head>, ...DeepPartialsT<Tail>]
  : T extends Array<unknown>
  ? Partial<T>
  : [];
type DeepPartial<T> = T extends Set<infer U>
  ? Set<DeepPartial<U> | undefined>
  : T extends Map<infer K, infer U>
  ? Map<K, DeepPartial<U> | undefined>
  : T extends { [key: string]: unknown }
  ? Partial<{ [K in keyof T]: DeepPartial<T[K]> }>
  : T extends [...unknown[]]
  ? Partial<DeepPartialsT<T>>
  : T;

type WithDeepMeta<T, M> = Schema<
  InferType<T>,
  InferOutputType<T>,
  DeepMeta<InferMetaType<T>> & M
>;
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
  schema: { [key: string]: Schema<unknown> };
}
  ? Omit<M, "schema"> & {
      schema: WithDeepMetaO<M["schema"], { required: false }>;
    }
  : M extends { schemas: [...Schema<unknown>[]] }
  ? Omit<M, "schemas"> & {
      schemas: WithDeepMetaT<M["schemas"], { required: false }>;
    }
  : M extends { schema: Schema<unknown> }
  ? Omit<M, "schema"> & {
      schema: WithDeepMeta<M["schema"], { required: false }>;
    }
  : M;

type DeepPartialSchema<I, O, M> = Schema<
  DeepPartial<I>,
  DeepPartial<O>,
  DeepMeta<M>
>;

export function deepPartial<I, O, M extends { type: string }>(
  schema: Schema<I, O, M>
): DeepPartialSchema<I, O, M> {
  const meta = schema.meta();

  switch (meta.type) {
    case "object": {
      const { schema, ...rest } = meta as unknown as {
        schema?: Record<string, Schema<unknown>>;
      };
      const partialSchema = {};
      for (const [key, value] of Object.entries(schema || {})) {
        partialSchema[key] = optional(deepPartial(value));
      }
      return withMetaInformation(
        object(partialSchema),
        rest
      ) as unknown as DeepPartialSchema<I, O, M>;
    }
    case "array": {
      const { schema, ...rest } = meta as unknown as {
        schema: Schema<unknown>;
      };
      const partialSchema = deepPartial(schema);
      return withMetaInformation(
        array(optional(partialSchema)),
        rest
      ) as unknown as DeepPartialSchema<I, O, M>;
    }
    case "tuple": {
      const { schemas, ...rest } = meta as unknown as {
        schemas: Schema<unknown>[];
      };
      const partialSchemas = schemas.map((s) => optional(deepPartial(s)));
      return withMetaInformation(
        tuple(...partialSchemas),
        rest
      ) as unknown as DeepPartialSchema<I, O, M>;
    }
    case "set": {
      const { schema, ...rest } = meta as unknown as {
        schema: Schema<unknown>;
      };
      const partialSchema = deepPartial(schema);
      return withMetaInformation(
        set(optional(partialSchema)),
        rest
      ) as unknown as DeepPartialSchema<I, O, M>;
    }
    case "record": {
      const { schema, ...rest } = meta as unknown as {
        schema: {
          key: Schema<string | number | symbol>;
          value: Schema<unknown>;
        };
      };
      const partialSchema = deepPartial(schema.value);
      return withMetaInformation(
        keyedRecord(schema.key, optional(partialSchema)),
        rest
      ) as unknown as DeepPartialSchema<I, O, M>;
    }
    case "map": {
      const { schema, ...rest } = meta as unknown as {
        schema: {
          key: Schema<string | number | symbol>;
          value: Schema<unknown>;
        };
      };
      const partialSchema = deepPartial(schema.value);
      return withMetaInformation(
        map(schema.key, optional(partialSchema)),
        rest
      ) as unknown as DeepPartialSchema<I, O, M>;
    }
    default: {
      return schema as unknown as DeepPartialSchema<I, O, M>;
    }
  }
}
