# Design alignment, milestone 1: shared components and app shell

Before/after production builds at 1280 × 900, captured with headless Chrome. Each screen has a `-before.png` (main at 69ebf26) and an `-after.png` (this milestone).

Intended visual changes:

- Small labels and helper text in shared components (field labels, alerts, toasts, progress, locale selector) go from 13px to `--font-size-sm` (14px), for readability.
- Page header description: 17px → `--font-size-lg` (18px), and 15px → `--font-size-md` (16px) on mobile.
- Logo: 21px → `--font-size-xl` (22px). Section titles: 26px → `--font-size-2xl` (28px).
- Badge: 3px → 4px vertical padding and 5px → 4px radius (`--radius-xs`).
- The legacy 1100px and 640px breakpoints now use the documented 1199px and 600px. Only widths from 1100 to 1199px and from 601 to 640px change layout.

Everything else, including the colors, shadows and shell dimensions now named as tokens, keeps its previous value.

Mobile layouts (390px) were also captured and compared. They show the same type changes and are not committed, to keep the repository small.
