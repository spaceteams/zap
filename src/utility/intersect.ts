export type Intersect<T extends readonly unknown[]> = T extends [
  infer Head,
  ...infer Tail
]
  ? Head & Intersect<Tail>
  : unknown;
