# Latest validation — theme switching

## Passed

- `npm run format:check`: consistent frontend and test formatting.
- `npm run lint`: no errors or warnings.
- `npx tsc --noEmit`: successful.
- `npm test`: fifteen checks for swipe geometry, metadata validation and theme preferences. Eight theme checks cover every supported saved value, invalid values, blocked storage, change notifications, cleanup, cross-tab synchronization, development restoration and the deterministic server snapshot.
- `.venv/bin/python -m unittest discover -s processing/tests -v`: ten checks covering power conversion, alignment, equal-area accounting, threshold equality, histogram tails, source/result consistency, change palette integrity and bounded catalog requests.
- `npm run build`: compiled and statically prerendered `/`, `/explore`, `/insights` and `/about` using Webpack.
- `node tests/http-smoke.mjs http://127.0.0.1:3001`: all pages expose the theme picker and six choices. Navigation, source-derived values, compiled styles, JSON, exact preview bytes/hashes, cache headers and 404s pass. A separate production check executed the served head script for all six stored choices and verified all six preview palettes were delivered.
- The refactored processing pipeline regenerated an **identical SHA-256 analysis report**, including the same content-addressed preview manifest. Original scientific inputs, legacy outputs and the legacy preparation script have no diff.
- `git diff --check`: successful.

## Scope and limitations

Selected text/background pairs were checked across all six palettes and measured at least 4.5:1. This is a palette check, not a complete accessibility audit. The theme script runs before content is painted, while a deterministic external-store snapshot keeps React hydration consistent.

The app shell renders on the server. Only navigation and interactive feature components require client rendering. Shared controls provide associated labels, value outputs, descriptions and keyboard-accessible native inputs. The map stays behind a client-only dynamic import; retry recreates the viewer without reloading the site.

No managed Browser connection was available. Screenshot review, actual pointer interactions, visual responsive checks, browser-console checks and assistive-technology testing are **not claimed**. Geometry and HTTP checks do not substitute for that browser pass.

The initial sandboxed build could not read its TypeScript subprocess output; the build passed outside the sandbox. No framework package or validation check was bypassed.

No supplemental raster was downloaded during the refactor. The scientific interpretation remains radar change, not validated water or flood extent. No deployment, commit, push or pull request was performed.
