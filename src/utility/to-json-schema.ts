import { Schema } from "../schema";
import { Literal } from "../simple";

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
  schema: Schema<unknown, unknown, M>,
  root = true
): Record<string, unknown> {
  const meta = schema.meta();
  if (root) {
    const header = {};
    const keys = ["description", "title", "$id", "$schema"];
    for (const key of keys) {
      if (key in meta) {
        header[key] = meta[key] as string;
      }
    }
    return {
      ...defaultHeader,
      ...header,
      ...toJsonSchema(schema, false),
    };
  }

  switch (meta.type) {
    case "null":
    case "boolean":
    case "string": {
      return cleanSimpleMeta<M>(meta);
    }
    case "number": {
      const { type, isInteger, ...rest } = meta as unknown as {
        type: "number";
        isInteger?: boolean;
      };
      return cleanSimpleMeta({
        ...rest,
        type: isInteger ? "integer" : type,
      });
    }
    case "record": {
      const recordMeta = meta as unknown as {
        type: "object";
        schema: { key: Schema<unknown>; value: Schema<unknown> };
      };
      return {
        type: "object",
        propertyNames: toJsonSchema(recordMeta.schema.key, false),
        additionalProperties: toJsonSchema(recordMeta.schema.value, false),
      };
    }
    case "object": {
      const objectMeta = meta as unknown as {
        type: "object";
        schema: { [key: string]: Schema<unknown> };
        additionalProperties: boolean | Schema<unknown>;
      };
      const required: string[] = [];
      const properties = {};
      for (const [key, inner] of Object.entries(objectMeta.schema)) {
        properties[key] = toJsonSchema(inner, false);
        const innerMeta = inner.meta();
        if (innerMeta["required"] === undefined || innerMeta["required"]) {
          required.push(key);
        }
      }
      return {
        type: "object",
        properties,
        required,
        additionalProperties:
          typeof objectMeta.additionalProperties === "boolean"
            ? objectMeta.additionalProperties
            : toJsonSchema(objectMeta.additionalProperties, false),
      };
    }
    case "array": {
      const arrayMeta = meta as unknown as { schema: Schema<unknown> };
      return {
        type: "array",
        items: toJsonSchema(arrayMeta.schema, false),
      };
    }
    case "tuple": {
      const tupleMeta = meta as unknown as { schemas: Schema<unknown>[] };
      return {
        type: "array",
        prefixItems: tupleMeta.schemas.map((s) => toJsonSchema(s, false)),
        items: false,
      };
    }
    case "or": {
      const tupleMeta = meta as unknown as { schemas: Schema<unknown>[] };
      return {
        anyOf: tupleMeta.schemas.map((s) => toJsonSchema(s, false)),
      };
    }
    case "and": {
      const tupleMeta = meta as unknown as { schemas: Schema<unknown>[] };
      return {
        allOf: tupleMeta.schemas.map((s) => toJsonSchema(s, false)),
      };
    }
    case "literal": {
      const literalMeta = meta as unknown as { literal: Literal };
      return {
        const: literalMeta.literal,
      };
    }
    case "literals": {
      const literalsMeta = meta as unknown as { literals: Literal[] };
      return {
        enum: literalsMeta.literals,
      };
    }
    case "nan": {
      return { type: "number" };
    }
  }
  return {};
}

function cleanSimpleMeta<M extends { type: string }>(meta: M) {
  const m = { ...meta };
  if ("required" in m) {
    delete m["required"];
  }
  return m;
}
