import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";

const PORT = 3000;
const cwd = process.cwd();
const nextDir = path.join(cwd, ".next");

function getListeningPids(port) {
  const output = execSync("netstat -ano -p tcp", { encoding: "utf8" });
  const lines = output.split(/\r?\n/);
  const pids = new Set();

  for (const raw of lines) {
    const line = raw.trim();
    if (!line.includes("LISTENING")) continue;
    if (!line.includes(`:${port}`)) continue;

    const parts = line.split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && /^\d+$/.test(pid)) {
      pids.add(pid);
    }
  }

  return [...pids];
}

function stopPids(pids) {
  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F /T`, { stdio: "ignore" });
      console.log(`[predev] stopped pid ${pid} on port ${PORT}`);
    } catch {
      // Best-effort kill.
    }
  }
}

function cleanNextCache() {
  if (!existsSync(nextDir)) return;
  rmSync(nextDir, { recursive: true, force: true });
  console.log("[predev] removed apps/web/.next cache");
}

try {
  const pids = getListeningPids(PORT);
  if (pids.length) {
    stopPids(pids);
  }
  cleanNextCache();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[predev] non-fatal setup issue: ${message}`);
}

