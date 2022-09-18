import { array, object, record, tuple } from "../composite";
import { optional } from "./optional";
import {
  InferMetaType,
  InferType,
  Schema,
  withMetaInformation,
} from "../schema";

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
    ? Omit<M, "schema"> & {
        schema: WithMetaO<M["schema"], { required: false }>;
      }
    : M extends { schemas: [...Schema<unknown, unknown>[]] }
    ? Omit<M, "schemas"> & {
        schemas: WithMetaT<M["schemas"], { required: false }>;
      }
    : M extends { schema: Schema<unknown, unknown> }
    ? Omit<M, "schema"> & { schema: WithMeta<M["schema"], { required: false }> }
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
            schema?: Record<string, Schema<unknown, unknown>>;
          }
        ).schema ?? {}
      )) {
        partialSchema[key] = optional(value);
      }
      const m = { ...meta };
      delete m["schema"];
      return withMetaInformation(
        object(partialSchema),
        m
      ) as unknown as PartialSchema<T, M>;
    }
    case "record": {
      const partialSchema = optional(
        (meta as unknown as { schema: Schema<unknown, unknown> }).schema
      );
      const m = { ...meta };
      delete m["schema"];
      return withMetaInformation(
        record(partialSchema) as unknown as PartialSchema<T, M>,
        m
      );
    }
    case "array": {
      const partialSchema = optional(
        (meta as unknown as { schema: Schema<unknown, unknown> }).schema
      );
      const m = { ...meta };
      delete m["schema"];
      return withMetaInformation(
        array(partialSchema) as unknown as PartialSchema<T, M>,
        m
      );
    }
    case "tuple": {
      const partialSchemas = (
        meta as unknown as { schemas: Schema<unknown, unknown>[] }
      ).schemas.map((s) => optional(s));
      const m = { ...meta };
      delete m["schemas"];
      return withMetaInformation(
        tuple(...partialSchemas) as unknown as PartialSchema<T, M>,
        m
      );
    }
    default:
      return schema as unknown as PartialSchema<T, M>;
  }
}
