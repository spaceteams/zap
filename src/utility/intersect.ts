export type Intersect<T extends [...unknown[]]> = T extends [
  infer Head,
  ...infer Tail
]
  ? Head & Intersect<Tail>
  : unknown;
