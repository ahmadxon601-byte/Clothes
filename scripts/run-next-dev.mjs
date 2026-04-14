import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const [portArg, distDirArg] = process.argv.slice(2);

const port = portArg?.trim() || "3010";
const distDir = distDirArg?.trim() || ".next-dev";
const useTurbopack =
  process.platform === "win32" &&
  process.env.NEXT_DISABLE_TURBOPACK !== "1";

const env = {
  ...process.env,
  NEXT_DIST_DIR: distDir,
};

const predev = spawnSync(process.execPath, ["scripts/predev.mjs"], {
  stdio: "inherit",
  env,
});

if ((predev.status ?? 1) !== 0) {
  process.exit(predev.status ?? 1);
}

const nextBin = require.resolve("next/dist/bin/next");
const nextArgs = [nextBin, "dev", "--hostname", "127.0.0.1", "--port", port];

if (useTurbopack) {
  nextArgs.push("--turbopack");
  console.log("[run-next-dev] using Turbopack on Windows");
}

const dev = spawnSync(process.execPath, nextArgs, {
  stdio: "inherit",
  env,
});

process.exit(dev.status ?? 0);
