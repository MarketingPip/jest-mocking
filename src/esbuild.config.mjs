import { build } from "esbuild";
import { nodeModulesPolyfillPlugin } from "esbuild-plugins-node-modules-polyfill";

async function run() {
  await build({
  bundle: true,
  minify: true,
  entryPoints: ["src/index.js"],
  outfile: "dist/jest.umd.js",
  format: 'esm',
  define: {
    global: 'window',
    'process.env.NODE_ENV': '"production"',
    'process.env.TERM': '"dumb"',
    'process.stdout.isTTY': 'false',
  },
  logLevel: 'error',
  plugins: [
    nodeModulesPolyfillPlugin({
      globals: {
        process: true,
        Buffer: true,
      },
    }),
  ],
});
}

run();
