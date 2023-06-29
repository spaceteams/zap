import { array, object, tuple } from "../composite";
import { InferOutputType, InferType, transform } from "../schema";
import { number, string } from "../simple";
import { partial } from "./partial";
import { readonly } from "./readonly";

describe("readonly", () => {
  // important in these tests is that it compiles and the inferred types LOOK correct in the IDE.
  it("works with objects", () => {
    const o = readonly(object({ a: number(), b: string() }), "b");
    type In = InferType<typeof o>;
    type Out = InferOutputType<typeof o>;

    const c: In = { a: 1, b: "2" };
    expect(c).toEqual(c);
    const d: Out = { a: 1, b: "2" };
    expect(d).toEqual(d);
  });
  it("works with transformations", () => {
    const o = readonly(object({ a: number(), b: string() }), "b");
    const t = readonly(
      transform(o, ({ a, b }) => ({ a, c: b })),
      "a"
    );
    type In = InferType<typeof t>;
    type Out = InferOutputType<typeof t>;

    const c: In = { a: 1, b: "2" };
    expect(c).toEqual(c);
    const d: Out = { a: 1, c: "2" };
    expect(d).toEqual(d);
  });
  it("works with partials", () => {
    const o = partial(readonly(object({ a: number(), b: string() }), "b"));
    type In = InferType<typeof o>;
    type Out = InferOutputType<typeof o>;

    const c: In = { a: 1 };
    expect(c).toEqual(c);
    const d: Out = { a: 1 };
    expect(d).toEqual(d);
  });
  it("works with tuples", () => {
    const tuples = readonly(tuple(number(), string()));
    type ReadonlyTuple = InferType<typeof tuples>;
    const c: ReadonlyTuple = [1, "2"];
    expect(c).toEqual(c);
  });
  it("works with arrays", () => {
    const arrays = readonly(array(number()));
    type ArrayIsReadonly = InferType<typeof arrays>;
    const c: ArrayIsReadonly = [1, 2];
    expect(c).toEqual(c);
  });
});
