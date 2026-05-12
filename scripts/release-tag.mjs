#!/usr/bin/env node
// Tag and push the current package.json version. Run AFTER your release PR
// has been merged on GitHub and you've pulled main locally.
//
// Usage:
//   npm run release:tag

import {
  run, git, log, c, confirm, usage, main,
  readPkg, readChangelog,
} from "./_lib.mjs";

const HELP = `
release:tag — Tag the current main commit and push the tag.

Usage:
  node scripts/release-tag.mjs [options]

Options:
  -y, --yes     Skip the confirmation prompt
  -h, --help    Show this help

This must be run AFTER your release PR has been merged into main.
The tag push triggers the release workflow on CI which:
  - Re-runs all quality gates
  - Verifies tag === package.json version
  - Publishes to npm with provenance
  - Creates a GitHub Release with the CHANGELOG section as body
`;

main(async () => {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) usage(HELP);

  log.step("Verifying state");

  const branch = await git.branch();
  if (branch !== "main") {
    log.fail(`You're on '${branch}'. Switch to main first: git checkout main`);
    process.exit(1);
  }
  log.ok("On main branch.");

  if (!(await git.isClean())) {
    log.fail("Working tree has uncommitted changes.");
    process.exit(1);
  }
  log.ok("Working tree clean.");

  log.info("Fetching origin...");
  await git.fetch();
  const ahead = await git.ahead("main", "origin/main");
  const behind = await git.behind("main", "origin/main");
  if (behind > 0) {
    log.fail(`Local main is ${behind} commits behind origin/main. Pull first: git pull origin main`);
    process.exit(1);
  }
  if (ahead > 0) {
    log.fail(`Local main is ${ahead} commits ahead of origin/main. Push or reset first.`);
    process.exit(1);
  }
  log.ok("Local main matches origin/main.");

  const { json: pkg } = await readPkg();
  const tag = `v${pkg.version}`;

  // Sanity check: make sure the origin remote matches the package name we are
  // about to tag. A prior incident saw `v1.1.8` (the client's version)
  // accidentally pushed to the server repo because the user was in the wrong
  // directory and short-circuited this script; the release workflow correctly
  // refused to publish, but it left a red CI run on the wrong repo. Catching
  // it here keeps the bad tag from ever reaching origin.
  const remoteUrl = await git.remote();
  const slugMatch = /[:/]([^:/]+\/[^/]+?)(?:\.git)?$/.exec(remoteUrl);
  const originSlug = slugMatch ? slugMatch[1] : null;
  if (originSlug) {
    const expectedRepo = pkg.name;
    const originRepo = originSlug.split("/")[1];
    if (originRepo !== expectedRepo) {
      log.fail(
        `Origin remote points to '${originSlug}' but package.json#name is '${expectedRepo}'. ` +
          `Refusing to tag — you are almost certainly in the wrong working directory.`,
      );
      process.exit(1);
    }
    log.ok(`Origin '${originSlug}' matches package '${expectedRepo}'.`);
  }

  const localTags = await git.capture("tag", "--list", tag);
  if (localTags === tag) {
    log.fail(`Local tag ${tag} already exists. Delete with: git tag -d ${tag}`);
    process.exit(1);
  }
  const remoteTags = await git.capture("ls-remote", "--tags", "origin", tag);
  if (remoteTags.includes(tag)) {
    log.fail(`Remote tag ${tag} already exists on origin. This version was already released.`);
    process.exit(1);
  }
  log.ok(`Tag ${tag} is free locally and on origin.`);

  const changelog = await readChangelog();
  if (changelog) {
    // Escape *every* regex metacharacter (including backslash) so a future
    // pre-release tag like `1.0.0-rc.1+build.7` cannot smuggle a partial
    // escape past us. The narrower `.replace(/\./g, "\\.")` form was flagged
    // by CodeQL `js/incomplete-sanitization` because it doesn't double the
    // backslash itself.
    const escaped = pkg.version.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
    const re = new RegExp(
      `^## \\[${escaped}\\][^\\n]*\\n([\\s\\S]*?)(?=^## \\[)`,
      "m",
    );
    const m = re.exec(changelog);
    if (m) {
      log.step(`Changelog excerpt for ${tag}:`);
      console.log(c.dim(m[1].trim().split("\n").map((l) => "  " + l).join("\n")));
    } else {
      log.warn(`No CHANGELOG section found for [${pkg.version}]. The GitHub Release body will fall back to a generic link.`);
    }
  }

  log.hr();
  const ok = await confirm(`Create and push tag ${c.bold(tag)}?`, true);
  if (!ok) {
    log.info("Cancelled.");
    return;
  }

  await run("git", ["tag", "-a", tag, "-m", tag]);
  log.ok(`Tag ${tag} created locally.`);

  await git.push("origin", tag);
  log.ok(`Tag ${tag} pushed to origin. Release workflow is running.`);

  const remote = await git.remote();
  const repoMatch = /[:/]([^:/]+\/[^/]+?)(?:\.git)?$/.exec(remote);
  const repoSlug = repoMatch ? repoMatch[1] : null;
  if (repoSlug) {
    console.log(`\nWatch the run:`);
    console.log(`  ${c.cyan(`https://github.com/${repoSlug}/actions/workflows/release.yml`)}`);
    console.log(`\nWhen it finishes, the package will be published:`);
    console.log(`  ${c.cyan(`https://www.npmjs.com/package/${pkg.name}/v/${pkg.version}`)}`);
  }
});
