# Design rules

These rules keep every screen consistent. They apply to people and AI assistants alike. Tokens live in the `:root` block of [`src/index.css`](../src/index.css). Reusable components live in [`src/components.tsx`](../src/components.tsx). The developer showcase (`pnpm dev:design`) shows both.

## 1. Use tokens, never raw values

Outside `:root`, CSS uses `var(--…)` for every design decision:

| Decision | Tokens |
|---|---|
| Color | `--surface-*` (including `-muted`, `-translucent`, `-inverse-hover`), `--text-*` (including `-inverse-secondary`, `-accent`, `-highlight`), `--surface-highlight`, `--surface-callout`, `--action-*`, `--accent-*`, `--feedback-*` (including `-border` variants), `--border-*`, `--focus-ring`, `--overlay` |
| Spacing (margin, padding, gap) | `--space-1` (4px) to `--space-16` (64px) |
| Font size | `--font-size-xs` (12), `-sm` (14), `-md` (16), `-lg` (18), `-xl` (22), `-2xl` (28), `-3xl` (36), `-title` (24–36 fluid), `-display` (34–48 fluid), `-hero` |
| Font weight | `--font-weight-regular` (400), `-medium` (600), `-semibold` (650), `-bold` (700) |
| Line height | `--line-height-tight` (1.1), `-snug` (1.2), `-body` (1.5), `-relaxed` (1.7) |
| Radius | `--radius-xs` (4), `--radius-sm` (8), `--radius-md` (12), `--radius-lg` (18). Use `999px` only for pills and `50%` only for circles |
| Shadow | `--shadow-1` (cards), `--shadow-2` (toasts), `--shadow-3` (dialogs), `--shadow-learning-card` |
| Motion | `--motion-fast` |
| Control height | `--control-height` (44px, also the minimum touch target), `--control-height-lg` (48px) |
| App shell | `--sidebar-width`, `--mobile-header-height`, `--bottom-nav-height` |
| Content width | `--measure-text` (600px, readable text), `--content-narrow` (760px, forms), `--content-default` (960px, pages) |
| Stacking | `--layer-sidebar` < `--layer-header` < `--layer-toast` < `--layer-dialog` < `--layer-skip-link` |

Allowed raw values: `0`, `1px` and `2px` borders, `100%`, and icon sizes inside `.icon`.

Screens use semantic tokens (`--surface-raised`, `--text-secondary`). `--primitive-*` tokens are referenced only inside `:root`.

If no token fits, do not invent a one-off value. Add a token to `:root`, document it here, and show it in the showcase in the same change.

## Themes

Colours have light values in `:root` and dark values in `:root[data-theme="dark"]`. Only semantic tokens get dark values; components never check the theme. `index.html` sets `data-theme` before the page renders (no light flash), from the saved choice in Settings (Match device, Light or Dark).

- When adding a semantic colour token, give it a dark value too. `scripts/theme-contrast.test.mjs` checks WCAG AA contrast for key pairs in both themes; add the new pair there.
- `prefers-contrast: more` strengthens text, borders and focus in both themes. `forced-colors: active` (Windows High Contrast) relies on system colours, with outlines for focus and selection, because shadows and backgrounds are removed.

## 2. Breakpoints

Only two breakpoints exist:

- `@media (max-width: 600px)`: mobile layout.
- `@media (max-width: 1199px)`: compact navigation (mobile header and bottom bar).

The legacy `640px` and `1100px` queries were moved to these two breakpoints on 16 November 2026.

## 3. Use the shared components

- Use `Button`, `IconButton`, `NavItem`, `CardButton`, `Badge`, `Chip`, `Field`, `LanguageSelect`, `SearchField`, `Tabs`, `Alert`, `Progress`, `Skeleton`, `EmptyState`, `Toast`, `Dialog` and `PageHeader` from `components.tsx`. Do not rebuild them with raw elements.
- Do not restyle a shared component for one screen. If a screen needs a new variant, add it to the component and the showcase.
- Do not use a raw `<button>` in screen files. Use `Button`, `IconButton` or `Chip` for actions, `NavItem` for navigation entries, and `CardButton` when a whole card is the click target.
- Do not use inline `style={{…}}` for visual styling. Use it only for values computed at runtime, such as a progress width.
- Tailwind is imported but not used for screen styling. Do not add Tailwind utility classes. Use the project classes and tokens.

## 4. Screen layout

Every top-level screen follows the same structure:

1. A `PageHeader` with the eyebrow, title and optional description.
2. Content constrained by `--content-default`, or `--content-narrow` for forms and settings.
3. Sections separated by `--space-6` (24px) on desktop and `--space-4` (16px) on mobile.
4. Paragraphs of explanatory text limited to `--measure-text`.

## 5. Accessibility rules that affect layout

- Interactive targets are at least `--control-height` (44px) high and wide.
- Keyboard focus uses the global focus ring. Do not remove or override it.
- Text and controls meet WCAG AA contrast against their surface.
- Respect `prefers-reduced-motion`. The global rule already disables animation.
- Every visible string goes through the translation catalogs, and layouts must survive longer German and Dutch labels.

## 6. Checklist for a UI change

- [ ] `pnpm design:check` passes.
- [ ] Shared components used, or a new variant added to `components.tsx` and the showcase.
- [ ] Checked at 390px and 1280px, in English and at least one longer locale (German or Dutch).
- [ ] Screenshots of touched screens refreshed when the change is visible.

## Automated check

`pnpm design:check` (also run in CI) enforces sections 1 to 3 in strict mode: any violation fails the build. It flags:

- raw colors, font sizes, font weights, line heights, radii, spacing and z-index values outside `:root`;
- `--primitive-*` tokens outside `:root`;
- breakpoints other than 600px and 1199px;
- raw `<button>` or inline `style={{…}}` in screen files. `components.tsx` and the `DesignSystem.tsx` showcase are exempt.

If the check fails, use a token or a shared component. If none fits, add one to `:root` or `components.tsx`, document it here, and show it in the showcase.

## History

- 16 November 2026: tokens for typography, controls, content widths and layers added. The design check started with 315 known violations recorded in a baseline.
- `13px` text was mapped to `--font-size-sm` (14px) for readability, and `11px` to `--font-size-xs` (12px).
- The migration ran in four milestones: shared components and shell, Practice, Translate/Explore/Notebook, and raw buttons. Each has before/after screenshots in [design-audit-2026-11-16](design-audit-2026-11-16/README.md). The baseline then reached zero and was removed, so the check is now strict.
