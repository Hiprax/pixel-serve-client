#!/usr/bin/env node
// Run all quality gates and print a clean summary.
//
// Usage:
//   npm run verify
//   npm run verify -- --skip lint     # skip a check by name
//   npm run verify -- --only test     # run only one

import { performance } from "node:perf_hooks";
import { run, log, c, usage, main } from "./_lib.mjs";

const HELP = `
verify — Run every quality gate locally.

Usage:
  node scripts/verify.mjs [options]

Options:
  --skip <name>   Skip a check (build | check-types-pack | type-check | lint | format | test)
  --only <name>   Run only one check
  -h, --help      Show this help
`;

main(async () => {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) usage(HELP);

  const skipIdx = args.indexOf("--skip");
  const onlyIdx = args.indexOf("--only");
  const skipName = skipIdx >= 0 ? args[skipIdx + 1] : null;
  const onlyName = onlyIdx >= 0 ? args[onlyIdx + 1] : null;

  let checks = [
    { name: "build", script: "build" },
    { name: "check-types-pack", script: "check-types-pack" },
    { name: "type-check", script: "type-check" },
    { name: "lint", script: "lint" },
    { name: "format", script: "format" },
    { name: "test", script: "test" },
  ];

  if (onlyName) checks = checks.filter((c) => c.name === onlyName);
  if (skipName) checks = checks.filter((c) => c.name !== skipName);

  if (checks.length === 0) {
    log.fail("No checks selected. Did you typo --only or --skip?");
    process.exit(1);
  }

  log.step(`Running ${checks.length} check${checks.length > 1 ? "s" : ""}`);

  const results = [];
  for (const check of checks) {
    const start = performance.now();
    process.stdout.write(`  ${c.dim("…")} ${check.name.padEnd(20)} `);
    try {
      await run("npm", ["run", "--silent", check.script], { silent: true });
      const dur = ((performance.now() - start) / 1000).toFixed(1);
      console.log(`${c.green("PASS")} ${c.dim(`(${dur}s)`)}`);
      results.push({ ...check, status: "PASS", duration: dur });
    } catch (err) {
      const dur = ((performance.now() - start) / 1000).toFixed(1);
      console.log(`${c.red("FAIL")} ${c.dim(`(${dur}s)`)}`);
      results.push({
        ...check,
        status: "FAIL",
        duration: dur,
        stdout: err.stdout || "",
        stderr: err.stderr || "",
      });
    }
  }

  const failed = results.filter((r) => r.status === "FAIL");

  log.hr();
  console.log(c.bold("Summary:"));
  for (const r of results) {
    const mark = r.status === "PASS" ? c.green("✓") : c.red("✗");
    console.log(`  ${mark} ${r.name.padEnd(20)} ${c.dim(`${r.duration}s`)}`);
  }

  if (failed.length === 0) {
    console.log(`\n${c.green(c.bold("All checks passed."))}`);
    return;
  }

  console.log("");
  log.fail(`${failed.length} check(s) failed.`);
  for (const f of failed) {
    log.hr();
    console.log(c.bold(c.red(`▼ ${f.name} output`)));
    if (f.stdout) console.log(f.stdout.trim());
    if (f.stderr) console.error(c.dim(f.stderr.trim()));
  }
  process.exit(1);
});
