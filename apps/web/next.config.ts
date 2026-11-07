import type { NextConfig } from "next";

// GITHUB_PAGES=true builds a plain static copy for kalebconway26.github.io/OwnTheBlock
// (see .github/workflows/pages.yml). Normal dev and Vercel builds are unaffected.
const pages = process.env.GITHUB_PAGES === "true";
const basePath = pages ? "/OwnTheBlock" : "";

const nextConfig: NextConfig = {
  ...(pages && { output: "export", basePath, trailingSlash: true, images: { unoptimized: true } }),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // Static export can't use partial prerendering, so these are off for the GitHub Pages build only.
  cacheComponents: !pages,
  partialPrefetching: !pages,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
