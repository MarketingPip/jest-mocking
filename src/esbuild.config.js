import { build } from "esbuild";
import { nodeModulesPolyfillPlugin } from "esbuild-plugins-node-modules-polyfill";

await build({
  bundle: true,
  minify: true,
  entryPoints: ["src/index.js"],
  outfile: "dist/jest.min.js",

  format: 'iife', // IMPORTANT: match browser usage
  globalName: "browserJest",

  define: {
    global: "window",
    "process.env.NODE_ENV": '"production"',
    "process.env.TERM": '"dumb"',
    "process.stdout.isTTY": 'false',
  },

  logLevel: "error",
  external: [
  'worker_threads',
//  'fs',
//  'path',
//  'os',
 'jest-worker',
 // 'write-file-atomic'
],
  plugins: [
    nodeModulesPolyfillPlugin({
      globals: {
        process: true,
        Buffer: true,
      },
    }),
  ],
});
