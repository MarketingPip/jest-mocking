import { build } from "esbuild";

await build({
  entryPoints: ["src/index.js"],
  outfile: "dist/jest.min.js",
  bundle: true,
  format: "esm",           // change to "iife" if you want browser global
  platform: "esm",     // your code targets browser-like env
  target: ["es2020"],
  minify: true,
  sourcemap: false,

  // Important: strip CDN-style version suffixes like "expect@29"
  plugins: [
    {
      name: "strip-version-suffix",
      setup(build) {
        build.onResolve({ filter: /@/ }, args => {
          // converts "expect@29" → "expect"
          const cleaned = args.path.replace(/@\d+$/, "");
          return { path: cleaned, external: false };
        });
      }
    }
  ],

  logLevel: "info",
});
