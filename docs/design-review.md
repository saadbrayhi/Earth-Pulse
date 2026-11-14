# Design review and palette update

The default Haor Ivory palette remains in `src/styles/theme.css`; the header picker also offers five additional light/dark palettes. Theme names and preference handling live in `src/lib/themes.ts`. The default palette uses:

- Light ivory background: `#f6f3eb`.
- Forest green actions and accents: `#28563d`.
- Muted gold details and focus: `#806329`.
- Warm white panels, dark forest headings and readable muted text.

Tailwind utilities, CSS and Recharts share these variables. The radar canvas stays dark, while blue `#286edc` and orange `#eb6937` retain their scientific meanings. No measurements, overlays or processing results were recolored or regenerated.

The update also increases small-label sizes, uses two-column navigation on narrow screens, styles keyboard focus consistently, and keeps on-image captions legible. Nine selected foreground/background pairs were checked numerically at or above 4.5:1. This is a palette check, not a claim of a complete accessibility audit or browser visual verification.

Suggested next work, in priority order:

1. Make the on-map swipe handle directly draggable. Currently the native range control moves the comparison divider.
2. Add place/context labels around the analysis region so users can orient themselves while keeping the local-data workflow reliable.
3. Resolve the missing source granule IDs, acquisition timestamps and orbit information before extending the analysis to more dates.
4. Run a live mobile, keyboard and error-retry browser pass. The managed Browser connection was unavailable during this update.
