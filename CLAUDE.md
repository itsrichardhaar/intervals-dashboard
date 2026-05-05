@AGENTS.md

## Documentation Rule
**Code first, read what was built, then write docs. Always.** Never write documentation in parallel with code — the docs agent must READ the finished code files before writing any documentation. The code is the source of truth. This prevents docs from describing features that don't exist or work differently than documented.

## Security Audit Rule
**Every feature MUST be audited before release.** After building any new feature, run a full code and security audit that reads the new/changed files and checks for: SQL injection, XSS, auth bypass, input validation, rate limiting, information disclosure, and code quality. Fix issues directly — do not just report them. No release ships without a passing audit.

## After Every Feature

When you complete a new feature, fix, or significant change:

1. **Update `FEATURES.md`** — add a concise entry under the appropriate section.
2. **Bump the version** — increment the patch version by 1 (e.g. `0.1.0` → `0.1.1`) in both:
   - `package.json` (`"version"` field)
   - `php/config/app.php` (`SC_VERSION` constant)
3. **Update `CHANGELOG.md`** — add the new version block at the top using Keep a Changelog format. Each entry is one concise line under `Added`, `Changed`, `Fixed`, or `Security`.
4. **Update `ROADMAP.md`** — mark the feature as shipped with strikethrough and **Shipped** label.
5. **Update `CHANNELS.md`** — if a new release was deployed to the test site, log it in the Deployment Log section.
6. **Always create a GitHub Release** — after committing and pushing, tag and publish a release. Run:
   ```bash
   npm run build
   git add -A
   git commit -m "v0.X.X — Description of changes"
   git push origin main
   git tag -a v0.X.X -m "v0.X.X — Description"
   git push origin v0.X.X
   gh release create v0.X.X --title "v0.X.X" --notes "Changelog entry"
   ```