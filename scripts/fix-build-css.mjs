import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const staticCssDir = join(root, ".next", "static", "css");
const targetDir = join(staticCssDir, "app");
const targetFile = join(targetDir, "layout.css");

if (!existsSync(staticCssDir)) {
  process.exit(0);
}

if (existsSync(targetFile)) {
  process.exit(0);
}

const sourceFiles = readdirSync(staticCssDir)
  .filter((name) => name.endsWith(".css"))
  .sort();

if (sourceFiles.length === 0) {
  process.exit(0);
}

mkdirSync(targetDir, { recursive: true });

const mergedCss = sourceFiles
  .map((name) => readFileSync(join(staticCssDir, name), "utf8"))
  .join("\n");

writeFileSync(targetFile, mergedCss);
