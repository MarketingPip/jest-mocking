import { build } from "esbuild";
import { nodeModulesPolyfillPlugin } from "esbuild-plugins-node-modules-polyfill";

await build({
  entryPoints: ["src/index.js"],
  outfile: "dist/jest.umd.js",
  bundle: true,
  format: "esm",
  globalName: "browserJest",
  platform: "browser",
  target: "es2020",
  minify: true,

  define: {
    global: "window",
    "process.env.NODE_ENV": '"production"',
  },

  plugins: [
    nodeModulesPolyfillPlugin({
      globals: { process: true, Buffer: true },
    }),
  ],
});
