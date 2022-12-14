import { array, keyedRecord, map, object, set, tuple } from "../composite";
import {
  InferMetaType,
  InferOutputType,
  InferType,
  Schema,
  withMetaInformation,
} from "../schema";
import { optional } from "./optional";

type WithMeta<T, M> = Schema<
  InferType<T>,
  InferOutputType<T>,
  InferMetaType<T> & M
>;
type WithMetaT<T extends [...unknown[]], M> = T extends [
  infer Head,
  ...infer Tail
]
  ? [WithMeta<Head, M>, ...WithMetaT<Tail, M>]
  : [];
type WithMetaO<T, M> = {
  [K in keyof T]: WithMeta<T[K], M>;
};

type SafePartial<T> = T extends Set<infer U>
  ? Set<U | undefined>
  : T extends Map<infer K, infer U>
  ? Map<K, U | undefined>
  : Partial<T>;

type PartialSchema<I, O, M> = Schema<
  SafePartial<I>,
  SafePartial<O>,
  M extends { schema: { [key: string]: Schema<unknown> } }
    ? Omit<M, "schema"> & {
        schema: WithMetaO<M["schema"], { required: false }>;
      }
    : M extends { schemas: [...Schema<unknown>[]] }
    ? Omit<M, "schemas"> & {
        schemas: WithMetaT<M["schemas"], { required: false }>;
      }
    : M extends { schema: Schema<unknown> }
    ? Omit<M, "schema"> & { schema: WithMeta<M["schema"], { required: false }> }
    : M
>;

export function partial<I, O, M extends { type: string }>(
  schema: Schema<I, O, M>
): PartialSchema<I, O, M> {
  const meta = schema.meta();
  switch (meta.type) {
    case "object": {
      const { schema, ...rest } = meta as unknown as {
        schema?: Record<string, Schema<unknown>>;
      };
      const partialSchema = {};
      for (const [key, value] of Object.entries(schema ?? {})) {
        partialSchema[key] = optional(value);
      }
      return withMetaInformation(
        object(partialSchema),
        rest
      ) as unknown as PartialSchema<I, O, M>;
    }
    case "array": {
      const { schema, ...rest } = meta as unknown as {
        schema: Schema<unknown>;
      };
      const partialSchema = optional(schema);
      return withMetaInformation(
        array(partialSchema),
        rest
      ) as unknown as PartialSchema<I, O, M>;
    }
    case "tuple": {
      const { schemas, ...rest } = meta as unknown as {
        schemas: Schema<unknown>[];
      };
      const partialSchemas = schemas.map((s) => optional(s));
      return withMetaInformation(
        tuple(...partialSchemas),
        rest
      ) as unknown as PartialSchema<I, O, M>;
    }
    case "set": {
      const { schema, ...rest } = meta as unknown as {
        schema: Schema<unknown>;
      };
      return withMetaInformation(
        set(optional(schema)),
        rest
      ) as unknown as PartialSchema<I, O, M>;
    }
    case "record": {
      const { schema, ...rest } = meta as unknown as {
        schema: {
          key: Schema<string | number | symbol>;
          value: Schema<unknown>;
        };
      };
      const partialSchema = optional(schema.value);
      return withMetaInformation(
        keyedRecord(schema.key, partialSchema),
        rest
      ) as unknown as PartialSchema<I, O, M>;
    }
    case "map": {
      const { schema, ...rest } = meta as unknown as {
        schema: {
          key: Schema<string | number | symbol>;
          value: Schema<unknown>;
        };
      };
      return withMetaInformation(
        map(schema.key, optional(schema.value)),
        rest
      ) as unknown as PartialSchema<I, O, M>;
    }
    default: {
      return schema as unknown as PartialSchema<I, O, M>;
    }
  }
}
