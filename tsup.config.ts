import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/index.ts"],
  format: ["esm"],
  sourcemap: true,
  target: "node18",
  outDir: "dist",
  treeshake: true,
  splitting: false,
  banner: ({ format }) => {
    if (format === "esm") {
      return {
        js: "#!/usr/bin/env node",
      };
    }
    return {};
  },
});