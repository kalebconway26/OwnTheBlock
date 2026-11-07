// Copies the latest recorded contract run into the app (Base Sepolia if it exists, else the local Hardhat run).
import fs from "node:fs";
import path from "node:path";

const here = path.dirname(new URL(import.meta.url).pathname);
const dep = path.resolve(here, "../../../contracts/deployments");
const src = ["baseSepolia.json", "hardhat.json"].map((f) => path.join(dep, f)).find((f) => fs.existsSync(f));
if (!src) {
  console.error("No deployment file found in", dep);
  process.exit(1);
}
const out = path.resolve(here, "../lib/chain/run.json");
fs.copyFileSync(src, out);
console.log("synced", path.basename(src), "->", out);
