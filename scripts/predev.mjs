import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const PORT = 3010;
const isWindows = process.platform === "win32";
const nextDirName = process.env.NEXT_DIST_DIR?.trim() || ".next";
const nextDir = join(process.cwd(), nextDirName);
const forceClean = process.env.NEXT_FORCE_CLEAN === "1";

function getListeningPids(port) {
  try {
    if (isWindows) {
      const output = execSync("netstat -ano -p tcp", { encoding: "utf8" });
      const pids = new Set();
      for (const raw of output.split(/\r?\n/)) {
        const line = raw.trim();
        if (!line.includes("LISTENING") || !line.includes(`:${port}`)) continue;
        const parts = line.split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid)) pids.add(pid);
      }
      return [...pids];
    } else {
      const output = execSync(`lsof -ti tcp:${port}`, { encoding: "utf8" });
      return output.trim().split(/\s+/).filter(Boolean);
    }
  } catch {
    return [];
  }
}

function stopPids(pids) {
  for (const pid of pids) {
    try {
      if (isWindows) {
        execSync(`taskkill /PID ${pid} /F /T`, { stdio: "ignore" });
      } else {
        execSync(`kill -9 ${pid}`, { stdio: "ignore" });
      }
      console.log(`[predev] stopped pid ${pid} on port ${PORT}`);
    } catch {
      // best-effort
    }
  }
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function clearNextDir() {
  if (!existsSync(nextDir)) {
    console.log(`[predev] no ${nextDirName} directory to clear`);
    return;
  }

  let lastError = null;

  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      rmSync(nextDir, { recursive: true, force: true });
      console.log(`[predev] cleared ${nextDirName} to avoid stale manifest errors`);
      return;
    } catch (error) {
      lastError = error;
      sleep(250 * attempt);
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`failed to clear ${nextDirName}: ${message}`);
}

try {
  const pids = getListeningPids(PORT);
  if (pids.length) stopPids(pids);
  if (forceClean) {
    clearNextDir();
  } else {
    console.log(`[predev] keeping ${nextDirName} cache (set NEXT_FORCE_CLEAN=1 to force a clean build)`);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[predev] setup failed: ${message}`);
  process.exit(1);
}
