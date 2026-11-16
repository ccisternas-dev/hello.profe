# Dark theme and contrast modes

Production build screenshots, captured through the Chrome DevTools Protocol at 1280 × 900 and 390 × 844.

- `*-light.png` and `*-dark.png`: Translate, Practice, Complete the Verb, a flashcard session, Settings and Notebook in both themes.
- `desktop-practice-system-dark.png`: "Match device" with the device set to dark.
- `desktop-complete-contrast-light.png` and `-contrast-dark.png`: the device asks for more contrast (`prefers-contrast: more`). Secondary text uses the primary text colour, borders are stronger and tinted panels become plain.
- `desktop-complete-forced.png` and `desktop-settings-forced.png`: forced colours, such as Windows High Contrast. The system palette applies; selection and focus use outlines.

`scripts/theme-contrast.test.mjs` checks WCAG AA contrast for the main text, action, feedback and boundary pairs in both themes. It found two existing light-theme values below 3:1 for UI boundaries: `--border-strong` and `--focus-ring`. Both were darkened slightly.
