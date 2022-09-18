export type Unionize<T extends [...unknown[]]> = T extends [
  infer Head,
  ...infer Tail
]
  ? Head | Unionize<Tail>
  : never;
