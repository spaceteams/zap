/* eslint-disable unicorn/no-null */

import { refine } from "../refine";
import { InferType } from "../schema";
import { number } from "../simple/number";
import { string } from "../simple/string";
import { defaultValue, optional } from "../utility/optional";
import { translate } from "../validation";
import { array } from "./array";
import {
  catchAll,
  Creatable,
  fromInstance,
  isInstance,
  keys,
  merge,
  object,
  omit,
  pick,
  strict,
} from "./object";

const schema = object({
  id: number(),
  name: array(string()),
  description: optional(string()),
  nested: object({
    user: string(),
  }),
});

class MyObject implements InferType<typeof schema> {
  private constructor(
    public readonly id: number,
    public readonly name: string[],
    public readonly nested: {
      user: string;
    }
  ) {}

  static build(id: number, name: string[]) {
    return new MyObject(id, name, {user: id.toFixed(0)})
  }
}


it("accepts", () => {
  expect(
    schema.accepts({
      id: 12,
      name: ["some", "string"],
      nested: { user: "3" },
    })
  ).toBeTruthy();
  expect(
    schema.accepts({
      id: 12,
      name: ["some", "string"],
      nested: { user: "3", additional: true },
    })
  ).toBeTruthy();

  expect(schema.accepts(null)).toBeFalsy();
  expect(
    schema.accepts({ id: 12, name: ["some", "string"], nested: {} })
  ).toBeFalsy();
  expect(
    schema.accepts({ id: "", name: ["some", "string"], nested: {} })
  ).toBeFalsy();
});

it("validates", () => {
  expect(translate(schema.validate(null))).toEqual("value is required");
  expect(translate(schema.validate(1))).toEqual(
    "value was of type number expected object"
  );
  expect(
    schema.validate({
      id: 12,
      name: ["some", "string"],
      nested: { user: "3" },
    })
  ).toBeUndefined();

  expect(
    translate(schema.validate({ id: "", name: ["some", "string"], nested: {} }))
  ).toEqual({
    id: "value was of type string expected number",
    nested: { user: "value is required" },
  });
});

it("validates with early exit", () => {
  expect(
    translate(
      schema.validate(
        { id: "", name: ["some", "string"], nested: {} },
        { earlyExit: true }
      )
    )
  ).toEqual({
    id: "value was of type string expected number",
  });
});

it("builds metadata", () => {
  expect(schema.meta().type).toEqual("object");
  expect(schema.meta().additionalProperties).toBeTruthy();
  expect(schema.meta().schema.id).toBeDefined();
  expect(Object.keys(schema.meta().schema)).toEqual([
    "id",
    "name",
    "description",
    "nested",
  ]);
});

it("parses", () => {
  expect(
    object({ a: defaultValue(optional(number()), 12) }).parse({}).parsedValue
  ).toEqual({ a: 12 });
});

it("parses with stripping", () => {
  expect(
    schema.parse({
      id: 12,
      name: ["first", "last"],
      nested: { user: "some user" },
      additional: "add",
    }).parsedValue
  ).toEqual({
    id: 12,
    name: ["first", "last"],
    nested: { user: "some user" },
  });
  expect(
    schema.parse(
      {
        id: 12,
        name: ["first", "last"],
        nested: { user: "some user" },
        additional: "add",
      },
      { strip: false }
    ).parsedValue
  ).toEqual({
    id: 12,
    name: ["first", "last"],
    nested: { user: "some user" },
    additional: "add",
  });
});

describe("strict", () => {
  it("validates", () => {
    expect(
      translate(
        strict(schema).validate({
          id: 12,
          name: ["first", "last"],
          nested: { user: "some user" },
          additional: "add",
        })
      )
    ).toEqual("additionalProperty(additional)");
  });

  it("builds metadata", () => {
    expect(strict(schema).meta().additionalProperties).toBeFalsy();
  });
});

describe("catchAll", () => {
  const catchAllSchema = catchAll(schema, number());
  it("validates", () => {
    expect(
      translate(
        catchAllSchema.validate({
          id: 12,
          name: ["first", "last"],
          nested: { user: "some user" },
          additional: 32,
        })
      )
    ).toBeUndefined();
    expect(
      translate(
        catchAllSchema.validate({
          id: 12,
          name: ["first", "last"],
          nested: { user: "some user" },
          additional: "add",
        })
      )
    ).toEqual({ additional: "value was of type string expected number" });
  });

  it("builds metadata", () => {
    expect(catchAllSchema.meta().additionalProperties.meta().type).toEqual(
      "number"
    );
  });
});

describe("isInstance", () => {
  const strictSchema = isInstance(schema, MyObject as Creatable<MyObject, "build">);
  const instanceSchema = fromInstance(MyObject as Creatable<MyObject, "build">);

  it("accepts", () => {
    expect(
      strictSchema.accepts(MyObject.build(12, []))
    ).toBeTruthy();
    expect(
      instanceSchema.accepts(MyObject.build(12, []))
    ).toBeTruthy();

    expect(
      strictSchema.accepts({ id: 12, name: [], nested: { user: "12" } })
    ).toBeFalsy();
    expect(
      instanceSchema.accepts({ id: 12, name: [], nested: { user: "12" } })
    ).toBeFalsy();
  });
});

const merged = merge(schema, object({ more: string() }));
describe("merge", () => {
  it("accepts", () => {
    expect(
      merged.accepts({
        id: 12,
        name: ["some", "string"],
        nested: { user: "3" },
        more: "string",
      })
    ).toBeTruthy();
    expect(
      merged.accepts({
        name: ["some", "string"],
        nested: { user: "3" },
        more: "string",
      })
    ).toBeFalsy();
    expect(
      merged.accepts({
        id: 12,
        name: ["some", "string"],
        nested: { user: "3" },
      })
    ).toBeFalsy();
  });
  it("builds metadata", () => {
    expect(merged.meta().type).toEqual("object");
    expect(merged.meta().schema.id).toBeDefined();
    expect(merged.meta().schema.more).toBeDefined();
    expect(Object.keys(merged.meta().schema)).toEqual([
      "id",
      "name",
      "description",
      "nested",
      "more",
    ]);
  });

  it("interops with refine", () => {
    const s = merge(
      refine(schema, ({ id, name }, { validIf }) => {
        return { name: validIf(name.length > id, "asdf") };
      }),
      object({ more: string() })
    );
    expect(
      translate(
        s.validate({
          id: 4,
          name: ["some", "string"],
          nested: { user: "3" },
        })
      )
    ).toEqual({ name: "asdf", more: "value is required" });
  });
});

describe("omit", () => {
  it("accepts", () => {
    expect(
      omit(schema, "id", "description").accepts({
        id: "",
        name: ["some", "string"],
        nested: { user: "3" },
      })
    ).toBeTruthy();
  });

  it("builds metadata", () => {
    expect(
      Object.keys(omit(schema, "id", "description").meta().schema)
    ).toEqual(["name", "nested"]);
  });

  it("interops with merge", () => {
    expect(
      omit(merged, "id", "description").accepts({
        id: "",
        name: ["some", "string"],
        nested: { user: "3" },
        more: "string",
      })
    ).toBeTruthy();
    expect(
      omit(merged, "id", "more").accepts({
        id: "",
        name: ["some", "string"],
        nested: { user: "3" },
        description: "string",
      })
    ).toBeTruthy();
  });
});

describe("pick", () => {
  it("accepts", () => {
    expect(
      pick(schema, "nested").accepts({ id: "", nested: { user: "3" } })
    ).toBeTruthy();
  });

  it("builds metadata", () => {
    expect(Object.keys(pick(schema, "nested").meta().schema)).toEqual([
      "nested",
    ]);
  });

  it("interops with merge", () => {
    expect(
      pick(merged, "id", "description").accepts({
        id: 12,
        name: ["some", "string"],
        nested: { user: "3" },
      })
    ).toBeTruthy();
    expect(
      pick(merged, "id", "more").accepts({
        id: 12,
        more: "string",
      })
    ).toBeTruthy();
  });
});

describe("keys", () => {
  it("accepts", () => {
    expect(keys(schema).accepts("id")).toBeTruthy();
  });

  it("builds metadata", () => {
    expect(keys(schema).meta().type).toEqual("literals");
    expect(keys(schema).meta().literals).toEqual([
      "id",
      "name",
      "description",
      "nested",
    ]);
  });
});
