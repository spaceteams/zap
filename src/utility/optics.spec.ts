import { array, object, tuple } from "../composite";
import { number } from "../simple";
import { focus, lens } from "./optics";

describe("array lens", () => {
  const schema = array(number());
  it("accepts", () => {
    expect(focus(schema).accepts(1)).toBeTruthy();
  });

  it("builds metadata", () => {
    expect(focus(schema).meta().type).toEqual("number");
  });
});

describe("object lens", () => {
  const schema = object({
    id: number(),
    nested: object({
      user: number(),
    }),
  });

  it("accepts", () => {
    expect(lens(schema, "nested").accepts({ user: 3 })).toBeTruthy();
    expect(lens(schema, "id").accepts(12)).toBeTruthy();
  });

  it("builds metadata", () => {
    expect(lens(schema, "id").meta().type).toEqual("number");
  });
});

describe("tuple lens", () => {
  const schema = tuple(number(), object({ id: number() }));

  it("accepts", () => {
    expect(lens(schema, 0).accepts(12)).toBeTruthy();
    expect(lens(lens(schema, 1), "id").accepts(12)).toBeTruthy();
  });

  it("builds metadata", () => {
    expect(lens(schema, 0).meta().type).toEqual("number");
  });
});
