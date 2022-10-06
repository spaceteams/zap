import { Schema } from "../schema";

type Transform<T, Source extends keyof T, Target extends keyof T> = (
  s: T[Source]
) => T[Target];

type OutNode<T, Source extends keyof T> = {
  [target in keyof T]?: Transform<T, Source, target>;
};

/**
 * Useful if you have a bunch of schemas and you want to convert values between them.
 * @see conversion-graph.spec.ts for examples
 */
export class ConversionGraph<T> {
  edges: {
    [source in keyof T]?: OutNode<T, source>;
  } = {};

  constructor(
    protected readonly nodes: {
      [key in keyof T]: Schema<T[key], unknown, unknown>;
    }
  ) {}

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

  bfs<Source extends keyof T, Target extends keyof T>(
    source: Source,
    target: Target
  ): Transform<T, Source, Target> | undefined {
    const seen = new Set<keyof T>([source]);
    const transformations: {
      [target in keyof T]?: Transform<T, Source, target>;
    } = {};

    let currentLayer: (keyof T)[] = [source];
    transformations[source] = (s) => s;
    if (source === (target as keyof T)) {
      return transformations[source] as
        | Transform<T, Source, Target>
        | undefined;
    }

    let nextLayer: (keyof T)[] = [];
    while (currentLayer.length > 0) {
      const current = currentLayer.pop() as keyof T;
      const out = this.edges[current];
      if (out) {
        for (const [n, t] of Object.entries(out)) {
          const neighbour = n as keyof T;
          if (seen.has(neighbour)) {
            continue;
          }

          const toNeighbour = (v: T[Source]) => {
            const transform = t as Transform<
              T,
              typeof current,
              typeof neighbour
            >;
            const toCurrent = transformations[current];
            if (toCurrent === undefined) {
              throw new Error("could not transform");
            }
            return transform(toCurrent(v));
          };
          if (neighbour === target) {
            return toNeighbour as Transform<T, Source, Target>;
          }

          nextLayer.push(neighbour);
          transformations[neighbour] = toNeighbour;
          seen.add(neighbour);
        }
      }
      if (currentLayer.length === 0) {
        currentLayer = nextLayer;
        nextLayer = [];
      }
    }
  }

  convert<Source extends keyof T, Target extends keyof T>(
    source: Source,
    target: Target,
    v: T[Source]
  ): T[Target] | undefined {
    const transform = this.bfs(source, target);
    return transform && transform(v);
  }
}
