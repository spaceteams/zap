import { and } from "./and";
import { ConversionGraph } from "./conversion-graph";
import { nonNegative, number } from "./number";
import { at, object, omit } from "./object";
import { optional } from "./optional";
import { nonEmpty, string } from "./string";

const v1 = number();
const v2 = object({
  value: number(),
  unit: string(),
});
const v3 = and(
  omit(v2, "unit"),
  object({
    unit: nonEmpty(at(v2, "unit")),
    decimalPlaces: optional(nonNegative(number())),
  })
);

const g = new ConversionGraph({ v1, v2, v3 });

g.addTransformation("v1", "v2", (v) => ({ value: v, unit: "m" }));
g.addTransformation("v2", "v3", ({ value, unit }) => ({
  value,
  unit: unit ? unit : "m",
}));

g.addTransformation("v2", "v1", ({ value }) => value);

describe("convert", () => {
  it("works on self edges", () => {
    expect(g.convert("v2", "v2", { value: 2, unit: "" })).toEqual({
      value: 2,
      unit: "",
    });
  });
  it("converts between schemata", () => {
    expect(g.convert("v2", "v3", { value: 2, unit: "" })).toEqual({
      value: 2,
      unit: "m",
    });
  });
  it("fails on unreachable target", () => {
    expect(
      g.convert("v3", "v2", { value: 2, unit: "", decimalPlaces: 2 })
    ).toEqual(undefined);
  });
});

describe("parse", () => {
  it("parses values into a target schema", () => {
    expect(g.parse("v2", 12)).toEqual({ value: 12, unit: "m" });
  });
  it("takes first viable source", () => {
    expect(g.parse("v3", { value: 12, unit: "" })).toEqual({
      value: 12,
      unit: "m",
    });
  });
});
