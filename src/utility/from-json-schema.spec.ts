import { fromJsonSchema } from "./from-json-schema";
import { toJsonSchema } from "./to-json-schema";

it("parses simple object", () => {
  const jsonSchema = {
    $id: "https://example.com/person.schema.json",
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Person",
    type: "object",
    properties: {
      firstName: {
        type: "string",
        description: "The person's first name.",
      },
      lastName: {
        type: "string",
        description: "The person's last name.",
      },
      age: {
        description:
          "Age in years which must be equal to or greater than zero.",
        type: "integer",
        minimum: 0,
      },
    },
  };
  const schema = fromJsonSchema(jsonSchema);
  expect(toJsonSchema(schema)).toEqual(expect.objectContaining(jsonSchema));
});
