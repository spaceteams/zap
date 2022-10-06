import { array, object, record, tuple } from "../composite";
import { optional } from "./optional";
import {
  InferMetaType,
  InferOutputType,
  InferType,
  Schema,
  withMetaInformation,
} from "../schema";

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

type PartialSchema<I, O, M> = Schema<
  Partial<I>,
  Partial<O>,
  M extends { schema: { [key: string]: Schema<unknown, unknown, unknown> } }
    ? Omit<M, "schema"> & {
        schema: WithMetaO<M["schema"], { required: false }>;
      }
    : M extends { schemas: [...Schema<unknown, unknown, unknown>[]] }
    ? Omit<M, "schemas"> & {
        schemas: WithMetaT<M["schemas"], { required: false }>;
      }
    : M extends { schema: Schema<unknown, unknown, unknown> }
    ? Omit<M, "schema"> & { schema: WithMeta<M["schema"], { required: false }> }
    : M
>;

export function partial<I, O, M extends { type: string }>(
  schema: Schema<I, O, M>
): PartialSchema<I, O, M> {
  const meta = schema.meta();
  switch (meta.type) {
    case "object": {
      const objectMeta = meta as unknown as {
        schema?: Record<string, Schema<unknown, unknown, unknown>>;
      };
      const partialSchema = {};
      for (const [key, value] of Object.entries(objectMeta.schema ?? {})) {
        partialSchema[key] = optional(value);
      }
      const { schema, ...rest } = objectMeta;
      return withMetaInformation(
        object(partialSchema),
        rest
      ) as unknown as PartialSchema<I, O, M>;
    }
    case "record": {
      const recordMeta = meta as unknown as {
        schema: Schema<unknown, unknown, { type: string }>;
      };
      const partialSchema = optional(recordMeta.schema);
      const { schema, ...rest } = recordMeta;
      return withMetaInformation(
        record(partialSchema),
        rest
      ) as unknown as PartialSchema<I, O, M>;
    }
    case "array": {
      const arrayMeta = meta as unknown as {
        schema: Schema<unknown, unknown, { type: string }>;
      };
      const partialSchema = optional(arrayMeta.schema);
      const { schema, ...rest } = arrayMeta;
      return withMetaInformation(
        array(partialSchema),
        rest
      ) as unknown as PartialSchema<I, O, M>;
    }
    case "tuple": {
      const tupleMeta = meta as unknown as {
        schemas: Schema<unknown, unknown, { type: string }>[];
      };
      const partialSchemas = tupleMeta.schemas.map((s) => optional(s));
      const { schemas, ...rest } = tupleMeta;
      return withMetaInformation(
        tuple(...partialSchemas),
        rest
      ) as unknown as PartialSchema<I, O, M>;
    }
    default:
      return schema as unknown as PartialSchema<I, O, M>;
  }
}
