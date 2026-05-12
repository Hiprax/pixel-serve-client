# Security Policy

`pixel-serve-client` is a React component that renders `<picture>` markup
pointing at a `pixel-serve-server` backend. Most of the security-sensitive
surface area (path traversal, SSRF, decompression bombs, etc.) lives on the
**server** side — see
[`pixel-serve-server/SECURITY.md`](https://github.com/Hiprax/pixel-serve-server/blob/main/SECURITY.md)
for that policy. This document covers issues specific to the client package.

## Supported Versions

Security fixes are backported to the **current** major release line.

| Version | Supported          | Notes                                                    |
| ------- | ------------------ | -------------------------------------------------------- |
| `1.x`   | Yes                | Active development line — all severities patched here    |
| `< 1.0` | No                 | Pre-stable; upgrade to `1.x`                             |

## Reporting a Vulnerability

**Please do not open a public GitHub issue** for security reports. Use one of
the following private channels, in order of preference:

1. **GitHub Security Advisories (preferred).** Open a draft advisory at
   [github.com/Hiprax/pixel-serve-client/security/advisories/new](https://github.com/Hiprax/pixel-serve-client/security/advisories/new).
   This keeps the report private until disclosure and gives maintainers a
   workspace to coordinate a patch and a CVE.
2. **Private email to the maintainer.** If GitHub is unavailable, contact the
   author listed in `package.json#author` via the email address on their
   GitHub profile.

When reporting, please include (as much as you can):

- A description of the vulnerability and the conditions required to reach it.
- The affected version(s) of `pixel-serve-client` (and React, Vite, etc. when
  relevant).
- A proof-of-concept component, codesandbox, or reproduction script.
- Suggested mitigations or fixes if you have them.

## Response Targets

- **Acknowledgement:** within 5 business days.
- **Initial assessment** (severity, scope, reproducer confirmation): within 10
  business days.
- **Fix or mitigation** for High / Critical issues: within 30 days of
  confirmation when feasible. Lower-severity issues are scheduled into the
  normal release cadence.

## Embargo and Disclosure Policy

`pixel-serve-client` follows a **90-day coordinated disclosure** window by
default. See the server package's `SECURITY.md` for the long-form policy.
Summary:

- Up to 90 days private window between acknowledgement and the patched
  release, extendable only by mutual agreement.
- The GitHub Security Advisory is published alongside the patched release.
- Credit is given to the reporter unless they request otherwise.

If a vulnerability is being actively exploited in the wild, the embargo can be
shortened — please flag this in the initial report.

## Scope

### In scope

- The `pixel-serve-client` npm package source under `src/` and the published
  `dist/` artifacts.
- The `<Pixel>` component, the `<Skeleton>` component, and the exported
  helpers (`buildPixelUrl`, `buildPixelSources`, `getMimeType`).
- The bundled fallback images in `src/assets/` (data URLs in the published
  bundle).

Common vulnerability classes that are explicitly in scope:

- **DOM injection / XSS** via props that flow into rendered HTML without
  proper escaping. The component renders `<picture>`, `<source>`, and `<img>`
  attributes; if any prop reaches the DOM in an unsafe shape, that is in
  scope.
- **URL injection** in `buildPixelUrl` / `buildPixelSources` (e.g., a hostile
  `src` that escapes the query-string encoding and rewrites the resulting
  URL).
- **Skeleton CSS injection** via the `ensureStyles()` helper that adds a
  `<style>` tag at runtime.
- **SSR hydration mismatches** that leak server state to the client (or vice
  versa) in a way that compromises confidentiality.
- **Prototype pollution** reachable through prop merging or option parsing.

### Out of scope

- **Vulnerabilities in development dependencies** (vite, vitest, eslint,
  testing-library, jsdom, etc.) that do not surface in the published `dist/`
  bundle.
- **Vulnerabilities in `react` / `react-dom`.** These are peer dependencies
  and are the consumer's responsibility to upgrade. Please report React
  issues upstream.
- **Server-side issues.** Anything to do with image fetching, SSRF, path
  traversal, Sharp decoding, decompression bombs, or the network allowlist
  lives in `pixel-serve-server` — please report there.
- **Misuse of `direct` mode.** When the consumer passes `direct={true}` the
  component renders the supplied `src` verbatim into `<img>`. The consumer is
  responsible for the trustworthiness of that URL.
- **Misuse of `fallbackSrc`.** Same contract as `direct` — supplied URLs are
  rendered verbatim.
- **Browser, OS, or React runtime vulnerabilities** that do not require a
  behavioral change in `pixel-serve-client` to mitigate.

## Thank You

Responsible disclosure makes the package safer for everyone. Reporters who
follow this policy will be credited in the published advisory.
