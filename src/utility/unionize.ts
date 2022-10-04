export type Unionize<T extends readonly unknown[]> = T extends [
  infer Head,
  ...infer Tail
]
  ? Head | Unionize<Tail>
  : never;
