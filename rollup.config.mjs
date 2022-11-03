import dts from "rollup-plugin-dts";
import resolve from "@rollup/plugin-node-resolve";

export default [
  {
    input: "build/index.js",
    output: {
      file: "dist/index.js",
      format: "cjs",
      sourcemap: true,
    },
    plugins: [resolve()],
  },
  {
    input: "build/index.d.ts",
    output: {
      file: "dist/index.d.ts",
      format: "es",
    },
    plugins: [dts()],
  },
];
