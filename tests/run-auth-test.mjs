import { spawn } from "child_process";
import http from "http";

const PORT = 3001;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function main() {
  console.log(`Starting Next.js production server on port ${PORT}...`);

  const serverProcess = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(PORT)],
    {
      env: {
        ...process.env,
        PORT: String(PORT),
        INITIAL_OWNER_SETUP_TOKEN: "lumina_secure_owner_setup_token_change_in_production_2026",
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  let readyResolve;
  const readyPromise = new Promise((resolve) => {
    readyResolve = resolve;
  });

  serverProcess.stdout.on("data", (d) => {
    const text = d.toString();
    process.stdout.write(`[Next.js stdout] ${text}`);
    if (text.includes("Ready in") || text.includes("started server on")) {
      readyResolve();
    }
  });

  serverProcess.stderr.on("data", (d) => {
    process.stderr.write(`[Next.js stderr] ${d}`);
  });

  try {
    console.log("Waiting for Next.js to report Ready...");
    await Promise.race([
      readyPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout waiting for Next.js Ready")), 30000)),
    ]);

    console.log(`✓ Next.js server is confirmed ready at ${BASE_URL}\n`);

    // Run tests
    const testProcess = spawn(process.execPath, ["tests/test-phase3-auth.mjs"], {
      stdio: "inherit",
    });

    const exitCode = await new Promise((resolve) => {
      testProcess.on("exit", (code) => resolve(code ?? 0));
    });

    console.log(`\nShutting down server...`);
    serverProcess.kill("SIGTERM");
    process.exit(exitCode);
  } catch (err) {
    console.error("Test runner error:", err);
    serverProcess.kill("SIGTERM");
    process.exit(1);
  }
}

main();

