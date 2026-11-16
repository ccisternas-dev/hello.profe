# Design alignment, milestone 4: raw buttons and strict mode

The last 8 raw `<button>` elements in screen files now use shared components:

| Where | Component |
|---|---|
| Sidebar and bottom navigation | New `NavItem` |
| Topic cards, learning-mode cards, notebook word card | New `CardButton` |
| Full-screen toggle | `Button` (it now accepts a `ref`) |
| Translation target languages | `Chip` |
| German character keys (ä, ö, ü, ß) | `Button` |

Before/after screenshots were captured for 12 flows at 1280 × 900 and 390 × 844. All of them are pixel-identical except the two intended changes kept here:

- A selected language chip now shows a check mark, like the `Chip` in the design showcase. That gives the selection a cue beyond color.
- German character keys use the button font weight (semibold).

With no violations left, the design check baseline was removed. `pnpm design:check` now fails on any violation.
