#!/usr/bin/env node
/**
 * gate-e2e.mjs — runs the full e2e suite with NO --project filter and exits 1 unless
 * every configured project reports 0 failed AND 0 skipped.
 *
 * WHY THIS EXISTS
 * A previous "all e2e passing" claim was one browser out of five (HANDOVER.md §3) —
 * the suite was run with a --project filter, and the report didn't say so. Skipped
 * tests count as a failure here too: a suite that silently skips on one project is the
 * same false confidence with a different shape, so "skipped" cannot be quietly green.
 *
 * playwright.config.ts's 5 projects (chromium-desktop, chromium-tablet,
 * chromium-mobile, firefox-desktop, webkit-mobile) are read back out of the run's own
 * JSON report rather than hardcoded here, so this gate can't drift from the config it's
 * checking. If a project produces zero test results at all — not even a skip — that is
 * flagged too: it is the same silent gap, one step further.
 */

import { spawn } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, fail, pass } from './gate-lib.mjs';

const JSON_OUT = join(ROOT, 'qa-artifacts', '.gate-e2e-playwright-report.json');

async function main() {
  mkdirSync(join(ROOT, 'qa-artifacts'), { recursive: true });
  rmSync(JSON_OUT, { force: true });

  console.log('  Running `playwright test` — no --project filter, all configured projects.\n');

  await runPlaywright();

  let report;
  try {
    report = JSON.parse(readFileSync(JSON_OUT, 'utf8'));
  } catch (e) {
    fail(`Could not read Playwright's JSON report at ${JSON_OUT}: ${e.message}`);
  }

  const configuredProjects = report.config?.projects?.map((p) => p.name) ?? [];
  if (configuredProjects.length === 0) {
    fail('playwright.config.ts reports zero projects — cannot evaluate per-project pass rate.');
  }

  const allTests = [];
  const walk = (suite) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        allTests.push({
          project: test.projectName,
          status: test.status, // 'expected' | 'unexpected' | 'skipped' | 'flaky'
          title: spec.title,
          file: spec.file,
        });
      }
    }
    for (const sub of suite.suites ?? []) walk(sub);
  };
  for (const s of report.suites ?? []) walk(s);

  const byProject = new Map(configuredProjects.map((name) => [name, { total: 0, unexpected: 0, skipped: 0, flaky: 0 }]));
  for (const t of allTests) {
    const bucket = byProject.get(t.project);
    if (!bucket) continue; // unknown project name — shouldn't happen, ignored rather than crashing
    bucket.total++;
    if (t.status === 'unexpected') bucket.unexpected++;
    if (t.status === 'skipped') bucket.skipped++;
    if (t.status === 'flaky') bucket.flaky++;
  }

  console.log('  === PER-PROJECT RESULTS ===\n');
  console.log('  project              total   failed   skipped   flaky');
  console.log('  -------------------- ------- -------- --------- -------');
  const failures = [];
  for (const name of configuredProjects) {
    const b = byProject.get(name);
    console.log(
      `  ${name.padEnd(20)} ${String(b.total).padEnd(7)} ${String(b.unexpected).padEnd(8)} ${String(b.skipped).padEnd(9)} ${b.flaky}`
    );
    if (b.total === 0) failures.push(`${name}: 0 tests ran (no results at all)`);
    if (b.unexpected > 0) failures.push(`${name}: ${b.unexpected} failed`);
    if (b.skipped > 0) failures.push(`${name}: ${b.skipped} skipped`);
  }

  mkdirSync(join(ROOT, 'qa-artifacts'), { recursive: true });
  writeFileSync(
    join(ROOT, 'qa-artifacts', 'gate-e2e-results.json'),
    JSON.stringify(
      {
        ranAt: new Date().toISOString(),
        configuredProjects,
        perProject: Object.fromEntries(byProject),
        stats: report.stats,
        failures,
      },
      null,
      2
    )
  );
  console.log('\n  Full results: qa-artifacts/gate-e2e-results.json');
  console.log(`  Playwright HTML report: playwright-report/index.html`);

  if (failures.length > 0) {
    fail(`${failures.length} problem(s) across ${configuredProjects.length} project(s):\n    ` + failures.join('\n    '));
  }
  pass(`All ${configuredProjects.length} projects: 0 failed, 0 skipped (${allTests.length} tests total).`);
}

function runPlaywright() {
  return new Promise((resolve) => {
    const proc = spawn('npx', ['playwright', 'test', '--reporter=line,json'], {
      cwd: ROOT,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: JSON_OUT },
    });
    // Resolve regardless of exit code — this gate makes its own pass/fail decision
    // from the JSON report, not from Playwright's own exit code (which doesn't
    // distinguish "skipped" from "passed").
    proc.on('exit', () => resolve());
    proc.on('error', (e) => fail(`Could not start playwright: ${e.message}`));
  });
}

main().catch((e) => fail(e?.stack ?? String(e)));
