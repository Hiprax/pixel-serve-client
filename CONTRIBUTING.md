# Contributing to pixel-serve-client

Thanks for your interest in improving `pixel-serve-client`. This document
captures the local development workflow, the coverage and code-style bar that
every PR is expected to meet, and the conventions the project follows for
issues and pull requests.

## Code of Conduct

Be respectful, assume good intent, and keep technical disagreements technical.
Personal attacks, harassment, and off-topic discussion are not welcome.
Maintainers may close issues and PRs that violate these expectations.

## Project Layout

```text
pixel-serve-client/
├── src/                    # Source (TypeScript + React, strict mode)
│   ├── components/         # Pixel, Skeleton
│   ├── assets/             # Bundled fallback images (data URLs at build time)
│   ├── functions.ts        # buildPixelUrl, buildPixelSources, getMimeType
│   └── types.ts            # PixelProps, PixelFormat, etc.
├── dist/                   # Build output (committed only at release)
├── coverage/               # Vitest coverage reports (git-ignored)
├── CHANGELOG.md            # Dated entries per release
├── README.md               # User-facing documentation
├── SECURITY.md             # Disclosure policy
└── CONTRIBUTING.md         # This file
```

## Local Development

### Prerequisites

- **Node.js >= 20** for the build/test toolchain (Vitest 4, ESLint 10, and
  jsdom 29 require Node 20+). Node 18 reached end-of-life on 2025-04-30.
- The bundled component itself runs in any browser that supports `<picture>`
  and the listed image formats — Node only matters for development.

### Setup

```bash
git clone https://github.com/Hiprax/pixel-serve-client.git
cd pixel-serve-client
npm install
```

### Daily Loop

```bash
npm run test:watch     # Vitest in watch mode (jsdom + Testing Library)
npm run lint           # ESLint
npm run format         # Prettier (check mode — use --write locally if needed)
npm run type-check     # tsc --noEmit
npm run build          # tsup → dist/ (data-URL bundled assets)
```

### Pre-Submit Checklist

Before opening a PR, run the full suite. Every check must pass:

```bash
npm run build
npm test
npm run lint
npm run type-check
```

`npm test` runs Vitest with coverage and enforces the thresholds below.

## Coverage Expectations

`vitest.config.ts` enforces hard thresholds on every run:

| Metric     | Threshold |
| ---------- | --------- |
| Lines      | 95%       |
| Functions  | 95%       |
| Statements | 95%       |
| Branches   | 90%       |

A PR that drops coverage below these thresholds will not pass CI. When you
add a code path, add at least one test that exercises it. The
`Pixel.test.tsx` suite covers rendering, preload behavior, SSR safety, and
edge cases like StrictMode double-mount — please keep that coverage intact.

## Code Style

- **TypeScript strict mode** is mandatory. Do not introduce `any` without a
  comment explaining why; prefer `unknown` and narrow with type guards.
- **ESLint + Prettier** rule the day. Run `npm run lint` and
  `npx prettier --write src/` before committing.
- **No new runtime dependencies.** React is a peer dependency; the published
  bundle currently has zero `dependencies`. Adding any runtime dep needs a
  strong justification.
- **SSR safety.** Guard against `window`, `document`, and `Image` access; the
  package must import cleanly in a Node SSR environment.
- **React.memo on `Pixel`** is intentional. Don't reach into the
  implementation in a way that breaks referential stability of the rendered
  output.
- **Bundled images stay data-URL-encoded** — tsup converts the imports at
  build time. Don't reach for `fetch()` against the bundled assets at
  runtime.

## Commit Style

There is no strict Conventional Commits enforcement, but commits should be
self-contained and have a meaningful subject line. Prefer:

```
pixel: cancel in-flight preload after unmount

Replaced the long-lived `useRef` mount flag with a local `cancelled` flag
scoped per effect run so StrictMode double-mount cannot flash a stale src.
```

over

```
fix bug
```

## Pull Request Guidelines

Before opening the PR, please confirm:

- [ ] All four `npm run` checks pass locally (`build`, `test`, `lint`,
      `type-check`).
- [ ] Coverage thresholds are still met (Vitest will fail the run otherwise).
- [ ] `CHANGELOG.md` has a new dated entry summarising the change with
      affected file paths.
- [ ] `README.md` is updated for any user-facing change (new prop, new
      behavior, new helper).
- [ ] New tests cover both the happy path and at least one failure path.
- [ ] No new runtime dependencies, or a justification in the PR description.

A good PR description includes:

1. **What** changed (the diff in plain English).
2. **Why** the change is needed (linked issue, bug report, or design rationale).
3. **How** the change was verified (the tests added, edge cases considered).
4. **Risk** — what could break and what the rollback story is.

Reviews focus on correctness, accessibility (alt text, ARIA hints in
`Skeleton`), SSR safety, and clarity in roughly that order.

## Sign-off / DCO

This project does **not** currently require a Developer Certificate of Origin
(DCO) sign-off. Submitting a PR implies you have the right to contribute the
code under the project's MIT license. If the project later adopts DCO, this
section will be updated.

## Reporting Bugs

Open a GitHub issue at
[github.com/Hiprax/pixel-serve-client/issues](https://github.com/Hiprax/pixel-serve-client/issues)
with:

- Version of `pixel-serve-client`, React, and the bundler / dev server in use.
- A minimal reproduction (codesandbox, stackblitz, or a small repo).
- Browser and OS where the problem reproduces (when applicable).
- Stack trace or console output if applicable.

**Security issues should go through the disclosure channels in
[`SECURITY.md`](./SECURITY.md), not the public issue tracker.**

## Releasing (Maintainers Only)

1. Land all PRs targeting the release.
2. Confirm `CHANGELOG.md` has an entry for the new version.
3. Bump `package.json` via `npm version patch|minor|major` (this creates a
   git tag).
4. Run the full pre-submit checklist one more time.
5. `npm publish` against the public registry.
6. Push tags: `git push --follow-tags`.
7. Publish the corresponding GitHub release with the changelog entry pasted
   into the body.

## Thank You

Every issue triaged, test added, doc tightened, and PR reviewed pushes the
package forward. Welcome aboard.
