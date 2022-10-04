import { Literal } from "../simple";
import { Schema } from "../schema";

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
    case "boolean":
    case "string":
      return meta;
    case "number": {
      const { type, isInteger, ...rest } = meta as unknown as {
        type: "number";
        isInteger?: boolean;
      };
      return {
        ...rest,
        type: isInteger ? "integer" : type,
      };
    }
    case "record": {
      const recordMeta = meta as unknown as {
        type: "object";
        schema: Schema<unknown, { type: string }>;
        key: Schema<unknown, { type: string }>;
      };
      return {
        type: "object",
        propertyNames: toJsonSchema(recordMeta.key),
        additionalProperties: toJsonSchema(recordMeta.schema),
      };
    }
    case "object": {
      const objectMeta = meta as unknown as {
        type: "object";
        schema: { [key: string]: Schema<unknown, { type: string }> };
        additionalProperties: boolean;
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
        additionalProperties: objectMeta.additionalProperties,
      };
    }
    case "array": {
      const arrayMeta = meta as unknown as {
        schema: Schema<unknown, { type: string }>;
      };
      return {
        type: "array",
        items: toJsonSchema(arrayMeta.schema),
      };
    }
    case "tuple": {
      const tupleMeta = meta as unknown as {
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
        schemas: Schema<unknown, { type: string }>[];
      };
      return {
        anyOf: tupleMeta.schemas.map((s) => toJsonSchema(s)),
      };
    }
    case "and": {
      const tupleMeta = meta as unknown as {
        schemas: Schema<unknown, { type: string }>[];
      };
      return {
        allOf: tupleMeta.schemas.map((s) => toJsonSchema(s)),
      };
    }
    case "literal": {
      const literalMeta = meta as unknown as {
        literal: Literal;
      };
      return {
        const: literalMeta.literal,
      };
    }
    case "literals": {
      const literalsMeta = meta as unknown as {
        literals: Literal[];
      };
      return {
        enum: literalsMeta.literals,
      };
    }
    case "nan":
      return { type: "number" };
  }
  return {};
}
