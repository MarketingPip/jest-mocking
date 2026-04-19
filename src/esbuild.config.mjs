import { build } from "esbuild";
import { nodeModulesPolyfillPlugin } from "esbuild-plugins-node-modules-polyfill";
await build({
  entryPoints: ["src/index.js"],
  outfile: "dist/jest.min.js",
  bundle: true,
  format: "esm",           // change to "iife" if you want browser global
  platform: "browser",     // your code targets browser-like env
  target: ["esnext"],
  minify: true,
  sourcemap: false,

  // Important: strip CDN-style version suffixes like "expect@29"
  plugins: [nodeModulesPolyfillPlugin({
      // Whether to polyfill specific globals.
      //modules: { fs: false, path: true, /* only what's needed */ },  
      globals: {
        Buffer: true, // can also be 'global', 'process'
      },
    })],

  logLevel: "info",
});
