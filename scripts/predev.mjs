import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const PORT = 3010;
const isWindows = process.platform === "win32";
const nextDir = join(process.cwd(), ".next");

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

try {
  const pids = getListeningPids(PORT);
  if (pids.length) stopPids(pids);
  if (existsSync(nextDir)) {
    rmSync(nextDir, { recursive: true, force: true });
    console.log("[predev] cleared .next to avoid stale manifest errors");
  } else {
    console.log("[predev] no .next directory to clear");
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[predev] non-fatal setup issue: ${message}`);
}
