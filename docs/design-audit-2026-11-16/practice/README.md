# Design alignment, milestone 2: Practice

Before/after production builds, captured through the Chrome DevTools Protocol with device emulation at 1280 × 900 (desktop) and 390 × 844 (mobile). Flows covered:
- Practice dashboard
- Translation Challenge settings and first question
- Flashcard topics
- Flashcard session (full screen by default on mobile)
- Desktop full-screen mode

Intended visual changes:

- Small text (13px, 15px) moves to `--font-size-sm` (14px) or `--font-size-md` (16px). Full-screen form labels go from 10px to 12px.
- Card and section titles at 20, 21 and 24px align to `--font-size-xl` (22px).
- Prompts and verb titles use the shared fluid sizes: `--font-size-display` (34–48px) and the new `--font-size-title` (24–36px). The session summary title uses the new `--font-size-3xl` (36px).
- Odd spacing (6, 10, 14, 22, 28, 42px) snaps to the 4px scale. Full-screen mode keeps its compact spacing at `--space-1` and `--space-2`.
- Raw teal and highlight colors become `--text-accent`, `--surface-highlight` and `--text-highlight`. The present-tense pill uses `--surface-learning-detail`.
