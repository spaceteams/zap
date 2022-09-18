import { and } from "../logic";
import { ConversionGraph } from "./conversion-graph";
import { nonNegative, number } from "../simple";
import { at, object, omit } from "../composite";
import { optional } from "../utility";
import { nonEmptyString, string } from "../simple";

const v1 = number();
const v2 = object({
  value: number(),
  unit: string(),
});
const v3 = and(
  omit(v2, "unit"),
  object({
    unit: nonEmptyString(at(v2, "unit")),
    decimalPlaces: optional(nonNegative(number())),
  })
);
const g = new ConversionGraph({ v1, v2, v3 });

g.addTransformation("v1", "v2", (v) => ({ value: v, unit: "m" }));
g.addTransformation("v2", "v3", ({ value, unit }) => ({
  value,
  unit: unit === "" ? "m" : unit,
}));

g.addTransformation("v2", "v1", ({ value }) => value);

describe("convert", () => {
  it("supports self edges", () => {
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
  it("finds a conversion path", () => {
    expect(g.convert("v1", "v3", 2)).toEqual({
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
