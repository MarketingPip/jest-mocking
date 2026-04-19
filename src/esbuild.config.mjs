import { build } from "esbuild";
import { nodeModulesPolyfillPlugin } from "esbuild-plugins-node-modules-polyfill";

await build({
  entryPoints: ["src/index.js"],
  outfile: "dist/jest.min.js",

  bundle: true,
  format: "esm",
  platform: "browser",
  target: "esnext",

  minify: true,
  sourcemap: false,

  define: {
    global: "window",
    "process.env.NODE_ENV": '"production"',
    "process.env.TERM": '"dumb"',
    "process.stdout.isTTY": "false",
  },

  plugins: [
    // 🔧 Fix "expect@29" → "expect"
    {
      name: "strip-version-suffix",
      setup(build) {
        build.onResolve({ filter: /@\d+$/ }, args => ({
          path: args.path.replace(/@\d+$/, ""),
        }));
      },
    },

    // 🧩 Node polyfills (like his setup)
    nodeModulesPolyfillPlugin({
      globals: {
        process: true,
        Buffer: true,
      },
    }),

    // 🚫 HARD BLOCK worker_threads (critical)
    {
      name: "stub-worker-threads",
      setup(build) {
        build.onResolve({ filter: /^worker_threads$/ }, () => ({
          path: "worker_threads_stub",
          namespace: "stub",
        }));

        build.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
          contents: `
            export const isMainThread = true;
            export const parentPort = null;
            export const workerData = null;
            export class Worker {
              constructor() {
                throw new Error("worker_threads is not supported in the browser");
              }
            }
          `,
          loader: "js",
        }));
      },
    },
  ],

  logLevel: "info",
});
