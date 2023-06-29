import { Schema } from "../schema";

type S<I, O, M, K extends keyof I> = Schema<
  I extends Record<string, unknown>
    ? {
        readonly [k in K]: I[k];
      } & {
        [Key in keyof I as Key extends K ? never : Key]: I[Key];
      }
    : Readonly<I>,
  O extends Record<string, unknown>
    ? {
        readonly [Key in keyof O as Key extends K ? Key : never]: O[Key];
      } & {
        [Key in keyof O as Key extends K ? never : Key]: O[Key];
      }
    : Readonly<I>,
  M
>;

export function readonly<I, O, M, K extends keyof I>(
  schema: Schema<I, O, M>,
  ..._keys: K[]
): S<I, O, M, K> {
  return schema as unknown as S<I, O, M, K>;
}
