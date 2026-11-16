# Design alignment, milestone 3: Translate, Explore and Notebook

Before/after production builds, captured through the Chrome DevTools Protocol with device emulation at 1280 × 900 (desktop) and 390 × 844 (mobile). Flows covered:
- Translate, empty and with a result
- Explore, on the Meanings and Conjugation tabs
- Notebook, empty and with a saved word

Intended visual changes:

- Text typed in the translator uses `--font-size-xl` (22px) at every width, instead of 25px on desktop and 20px on mobile.
- Small text (13px) moves to `--font-size-sm` (14px). Conjugation tables go from 15px to 14px.
- Result headings use `--font-size-3xl` (36px instead of 34px). Error, detail and notebook headings align to `--font-size-xl` and `--font-size-2xl`.
- The word hero uses `--font-size-hero` on mobile too (48px instead of 52px), with `--line-height-tight`.
- Example callouts use the new `--surface-callout` token (same color). The generated-source icon uses `--feedback-warning`.
