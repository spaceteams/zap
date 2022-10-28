import {
  array,
  map,
  object,
  record,
  set,
  tuple,
  validatedProcedure,
  validatedPromise,
} from "../composite";
import { number, string } from "../simple";
import { into, get } from "./optics";

describe("array get", () => {
  const schema = array(number());
  it("accepts", () => {
    expect(into(schema).accepts(1)).toBeTruthy();
  });

  it("builds metadata", () => {
    expect(into(schema).meta().type).toEqual("number");
  });
});

describe("object get", () => {
  const schema = object({
    id: number(),
    nested: object({
      user: number(),
    }),
  });

  it("accepts", () => {
    expect(get(schema, "nested").accepts({ user: 3 })).toBeTruthy();
    expect(get(schema, "id").accepts(12)).toBeTruthy();
  });

  it("builds metadata", () => {
    expect(get(schema, "id").meta().type).toEqual("number");
  });
});

describe("tuple get", () => {
  const schema = tuple(number(), object({ id: number() }));

  it("accepts", () => {
    expect(get(schema, 0).accepts(12)).toBeTruthy();
    expect(get(get(schema, 1), "id").accepts(12)).toBeTruthy();
  });

  it("builds metadata", () => {
    expect(get(schema, 0).meta().type).toEqual("number");
  });
});

describe("procedure get", () => {
  const schema = validatedProcedure(tuple(number(), string()), number());

  it("accepts", () => {
    expect(get(schema, "args").accepts([12, "string"])).toBeTruthy();
  });

  it("builds metadata", () => {
    expect(get(schema, "result").meta().type).toEqual("number");
  });
});

describe("promise get", () => {
  const schema = validatedPromise(number());

  it("accepts", () => {
    expect(into(schema).accepts(12)).toBeTruthy();
  });

  it("builds metadata", () => {
    expect(into(schema).meta().type).toEqual("number");
  });
});

describe("set get", () => {
  const schema = set(number());

  it("accepts", () => {
    expect(into(schema).accepts(12)).toBeTruthy();
  });

  it("builds metadata", () => {
    expect(into(schema).meta().type).toEqual("number");
  });
});

describe("map get", () => {
  const schema = map(string(), number());

  it("accepts", () => {
    expect(get(schema, "key").accepts("12")).toBeTruthy();
  });

  it("builds metadata", () => {
    expect(get(schema, "value").meta().type).toEqual("number");
  });
});

describe("record get", () => {
  const schema = record(number());

  it("accepts", () => {
    expect(get(schema, "key").accepts("12")).toBeTruthy();
  });

  it("builds metadata", () => {
    expect(get(schema, "value").meta().type).toEqual("number");
  });
});
