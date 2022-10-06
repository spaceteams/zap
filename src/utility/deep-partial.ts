import { array, object, record, tuple } from "../composite";
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
type DeepPartial<T> = T extends { [key: string]: unknown }
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
  schema: { [key: string]: Schema<unknown, unknown, unknown> };
}
  ? Omit<M, "schema"> & {
      schema: WithDeepMetaO<M["schema"], { required: false }>;
    }
  : M extends { schemas: [...Schema<unknown, unknown, unknown>[]] }
  ? Omit<M, "schemas"> & {
      schemas: WithDeepMetaT<M["schemas"], { required: false }>;
    }
  : M extends { schema: Schema<unknown, unknown, unknown> }
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
      const objectMeta = meta as unknown as {
        schema?: Record<string, Schema<unknown, unknown, { type: string }>>;
      };
      const partialSchema = {};
      for (const [key, value] of Object.entries(objectMeta.schema || {})) {
        partialSchema[key] = optional(deepPartial(value));
      }
      const { schema, ...rest } = objectMeta;
      return withMetaInformation(
        object(partialSchema),
        rest
      ) as unknown as DeepPartialSchema<I, O, M>;
    }
    case "record": {
      const recordMeta = meta as unknown as {
        schema: Schema<unknown, unknown, { type: string }>;
      };
      const partialSchema = deepPartial(recordMeta.schema);
      const { schema, ...rest } = recordMeta;
      return withMetaInformation(
        record(optional(partialSchema)),
        rest
      ) as unknown as DeepPartialSchema<I, O, M>;
    }
    case "array": {
      const arrayMeta = meta as unknown as {
        schema: Schema<unknown, unknown, { type: string }>;
      };
      const partialSchema = deepPartial(arrayMeta.schema);
      const { schema, ...rest } = arrayMeta;
      return withMetaInformation(
        array(optional(partialSchema)),
        rest
      ) as unknown as DeepPartialSchema<I, O, M>;
    }
    case "tuple": {
      const tupleMeta = meta as unknown as {
        schemas: Schema<unknown, unknown, { type: string }>[];
      };
      const partialSchemas = tupleMeta.schemas.map((s) =>
        optional(deepPartial(s))
      );
      const { schemas, ...rest } = tupleMeta;
      return withMetaInformation(
        tuple(...partialSchemas),
        rest
      ) as unknown as DeepPartialSchema<I, O, M>;
    }
    default:
      return schema as unknown as DeepPartialSchema<I, O, M>;
  }
}
