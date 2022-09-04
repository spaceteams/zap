import { Schema } from "./schema";

type OutNode<T, Source extends keyof T> = {
  [target in keyof T]?: (s: T[Source]) => T[target];
};

export class ConversionGraph<T> {
  edges: {
    [source in keyof T]?: OutNode<T, source>;
  } = {};

  constructor(protected readonly nodes: { [key in keyof T]: Schema<T[key]> }) {}

  firstNodeOf(value: unknown): keyof T | undefined {
    const allKeys = Object.keys(this.nodes) as (keyof T)[];
    return allKeys.find((key) => this.nodes[key].accepts(value));
  }

  addTransformation<Source extends keyof T, Target extends keyof T>(
    source: Source,
    target: Target,
    transformer: (a: T[Source]) => T[Target]
  ) {
    const e = this.edges[source] ?? ({} as OutNode<T, Source>);
    e[target] = transformer;
    this.edges[source] = e;
  }

  convert<Source extends keyof T, Target extends keyof T>(
    source: Source,
    target: Target,
    v: T[Source]
  ): T[Target] | undefined {
    if ((source as string) === (target as string)) {
      return v as unknown as T[Target];
    }
    const transform = this.edges?.[source]?.[target];
    return transform && transform(v);
  }

  parse<Target extends keyof T>(
    target: Target,
    v: unknown
  ): T[Target] | undefined {
    const firstNode = this.firstNodeOf(v);
    if (firstNode === undefined) {
      return undefined;
    }
    return this.convert(firstNode, target, this.nodes[firstNode].parse(v));
  }
}
