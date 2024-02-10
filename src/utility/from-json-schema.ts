import { object, strict } from "../composite";
import { Schema, withMetaInformation } from "../schema";
import {
  exclusiveMaximum,
  exclusiveMinimum,
  integer,
  maximum,
  minimum,
  multipleOf,
  negative,
  nonNegative,
  nonPositive,
  number,
  positive,
  string,
} from "../simple";
import { optional } from "./optional";

export function fromJsonSchema(json: Record<string, unknown>): Schema<unknown> {
  switch (json.type) {
    case "object": {
      const fields = {};
      const properties = json.properties as Record<
        string,
        Record<string, unknown>
      >;
      const required = (json.required ?? []) as string[];
      for (const property of Object.keys(properties)) {
        const field = fromJsonSchema(properties[property]);
        fields[property] = required.includes(property)
          ? field
          : optional(field);
      }
      const fieldsSchema = object(fields);

      const additionalProperties = json.additionalProperties ?? false;
      const objectSchema: Schema<unknown> = additionalProperties
        ? fieldsSchema
        : strict(fieldsSchema);
      return extendWithMetaInformation(json, objectSchema);
    }
    case "string": {
      return extendWithMetaInformation(json, string());
    }
    case "number":
    case "integer": {
      let schema = number();
      if (json.type === "integer") {
        schema = integer(schema);
      }
      if ("positive" in json) {
        schema = positive(schema);
      }
      if ("nonPositive" in json) {
        schema = nonPositive(schema);
      }
      if ("negative" in json) {
        schema = negative(schema);
      }
      if ("nonNegative" in json) {
        schema = nonNegative(schema);
      }
      if ("multipleOf" in json) {
        schema = multipleOf(schema, json.multipleOf as number);
      }
      if ("exclusiveMaximum" in json) {
        schema = exclusiveMaximum(schema, json.exclusiveMaximum as number);
      }
      if ("exclusiveMinimum" in json) {
        schema = exclusiveMinimum(schema, json.exclusiveMinimum as number);
      }
      if ("maximum" in json) {
        schema = maximum(schema, json.maximum as number);
      }
      if ("minimum" in json) {
        schema = minimum(schema, json.minimum as number);
      }
      return extendWithMetaInformation(json, schema);
    }
  }
  throw new Error("could not parse schema");
}

function extendWithMetaInformation(
  json: Record<string, unknown>,
  objectSchema: Schema<unknown, unknown, { type: string }>
) {
  const meta = {};
  const keys = ["description", "title", "$id", "$schema"];
  for (const key of keys) {
    if (key in json) {
      meta[key] = json[key];
    }
  }
  if (Object.keys(meta).length > 0) {
    return withMetaInformation(objectSchema, meta);
  }
  return objectSchema;
}
