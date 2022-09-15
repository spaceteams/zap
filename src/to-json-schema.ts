import { Schema } from "./schema";

interface JsonSchemaHeader {
  $schema: string;
  $id: string;
  title: string;
  description: string;
}
const defaultHeader: Partial<JsonSchemaHeader> = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
};

export function toJsonSchema<M extends { type: string }>(
  schema: Schema<unknown, M>,
  header?: Partial<JsonSchemaHeader>
): Record<string, unknown> {
  if (header) {
    return {
      ...defaultHeader,
      ...header,
      ...toJsonSchema(schema),
    };
  }

  const meta = schema.meta();
  switch (meta.type) {
    case "null":
    case "number":
    case "boolean":
    case "string":
    case "integer":
      return meta;
    case "object": {
      const objectMeta = meta as unknown as {
        type: "object";
        schema: { [key: string]: Schema<unknown, { type: string }> };
      };
      const required: string[] = [];
      const properties = {};
      for (const [key, inner] of Object.entries(objectMeta.schema)) {
        properties[key] = toJsonSchema(inner);
        const innerMeta = inner.meta();
        if (innerMeta["required"] === undefined || innerMeta["required"]) {
          required.push(key);
        }
      }
      return {
        type: "object",
        properties,
        required,
      };
    }
    case "array": {
      const arrayMeta = meta as unknown as {
        type: "array";
        schema: Schema<unknown, { type: string }>;
      };
      return {
        type: "array",
        items: toJsonSchema(arrayMeta.schema),
      };
    }
    case "tuple": {
      const tupleMeta = meta as unknown as {
        type: "array";
        schemas: Schema<unknown, { type: string }>[];
      };
      return {
        type: "array",
        prefixItems: tupleMeta.schemas.map((s) => toJsonSchema(s)),
        items: false,
      };
    }
    case "or": {
      const tupleMeta = meta as unknown as {
        type: "or";
        schemas: Schema<unknown, { type: string }>[];
      };
      return {
        anyOf: tupleMeta.schemas.map((s) => toJsonSchema(s)),
      };
    }
    case "and": {
      const tupleMeta = meta as unknown as {
        type: "and";
        schemas: Schema<unknown, { type: string }>[];
      };
      return {
        allOf: tupleMeta.schemas.map((s) => toJsonSchema(s)),
      };
    }
    case "literal": {
      const literalMeta = meta as unknown as {
        type: "literal";
        literal: string | symbol | number;
      };
      return {
        const: literalMeta.literal,
      };
    }
    case "nan":
      return { type: "number" };
  }
  return {};
}
