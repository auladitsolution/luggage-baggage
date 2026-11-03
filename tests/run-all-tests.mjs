import { spawn } from "child_process";

const PORT = 3001;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runTestFile(scriptPath) {
  const p = spawn(process.execPath, [scriptPath], { stdio: "inherit" });
  return new Promise((resolve) => {
    p.on("exit", (code) => resolve(code ?? 0));
  });
}

async function main() {
  console.log(`Starting Next.js production server on port ${PORT}...`);

  const serverProcess = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(PORT)],
    {
      env: {
        ...process.env,
        NODE_ENV: "production",
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
    process.stdout.write(`[SERVER] ${text}`);
    if (text.includes("Ready in") || text.includes("started server on")) {
      readyResolve();
    }
  });

  serverProcess.stderr.on("data", (d) => {
    // suppress mongoose duplicate index warnings in test output
    const text = d.toString();
    if (!text.includes("Duplicate schema index")) {
      process.stderr.write(text);
    }
  });

  try {
    await Promise.race([
      readyPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout waiting for Next.js Ready")), 30000)),
    ]);

    console.log(`✓ Next.js server confirmed ready at ${BASE_URL}\n`);
    await new Promise((r) => setTimeout(r, 2000));

    // Run Phase 3 Auth Tests
    const code3 = await runTestFile("tests/test-phase3-auth.mjs");
    if (code3 !== 0) {
      console.error("Phase 3 tests failed.");
      serverProcess.kill("SIGTERM");
      process.exit(code3);
    }

    console.log("\n");

    // Run Store Owner & Staff Provisioning Auth Tests
    const codeOwner = await runTestFile("tests/test-owner-and-auth.mjs");
    if (codeOwner !== 0) {
      console.error("Store Owner & Staff Auth tests failed.");
      serverProcess.kill("SIGTERM");
      process.exit(codeOwner);
    }

    console.log("\n");

    // Run Phase 4 Catalog & Inventory Tests
    const code4 = await runTestFile("tests/test-phase4-catalog-inventory.mjs");
    if (code4 !== 0) {
      console.error("Phase 4 tests failed.");
      serverProcess.kill("SIGTERM");
      process.exit(code4);
    }

    console.log("\n");

    // Run Phase 5 POS Sales & Printing Tests
    const code5 = await runTestFile("tests/test-phase5-pos-sales.mjs");
    if (code5 !== 0) {
      console.error("Phase 5 tests failed.");
      serverProcess.kill("SIGTERM");
      process.exit(code5);
    }

    console.log("\n");

    // Run Phase 6 Customer & Credit Dues Tests
    const code6 = await runTestFile("tests/test-phase6-customer-dues.mjs");
    if (code6 !== 0) {
      console.error("Phase 6 tests failed.");
      serverProcess.kill("SIGTERM");
      process.exit(code6);
    }

    console.log("\n");

    // Run Phase 7 Purchasing & Expenses Tests
    const code7 = await runTestFile("tests/test-phase7-purchasing-expenses.mjs");
    if (code7 !== 0) {
      console.error("Phase 7 tests failed.");
      serverProcess.kill("SIGTERM");
      process.exit(code7);
    }

    console.log("\n");

    // Run Phase 8 E-Commerce Storefront & Online Orders Tests
    const code8 = await runTestFile("tests/test-phase8-ecommerce-orders.mjs");
    if (code8 !== 0) {
      console.error("Phase 8 tests failed.");
      serverProcess.kill("SIGTERM");
      process.exit(code8);
    }

    console.log("\n");

    // Run Var-7 & Catalog Auto-Seeding Order Fix Test
    const codeVar7 = await runTestFile("tests/test-order-var7-fix.mjs");
    if (codeVar7 !== 0) {
      console.error("Var-7 & Catalog Auto-Seeding tests failed.");
      serverProcess.kill("SIGTERM");
      process.exit(codeVar7);
    }

    console.log("\n");

    // Run Phase 9 Employees, Payroll & Accounting Reports Tests
    const code9 = await runTestFile("tests/test-phase9-payroll-accounting.mjs");
    if (code9 !== 0) {
      console.error("Phase 9 tests failed.");
      serverProcess.kill("SIGTERM");
      process.exit(code9);
    }

    console.log("\n");

    // Run Phase 10 Comprehensive Browser, Security & End-to-End Workflow Verification Tests
    const code10 = await runTestFile("tests/test-phase10-browser-and-workflows.mjs");
    if (code10 !== 0) {
      console.error("Phase 10 tests failed.");
      serverProcess.kill("SIGTERM");
      process.exit(code10);
    }

    console.log("\nShutting down server...");
    serverProcess.kill("SIGTERM");
    console.log("All test suites passed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Test execution error:", err);
    serverProcess.kill("SIGTERM");
    process.exit(1);
  }
}

main();

