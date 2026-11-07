# Design consistency audit — 7 November 2026

[Open screenshot gallery](index.html) · [Capture manifest](manifest.json)

## Scope and evidence

Reviewed the current local working copy, including pre-existing uncommitted UI changes, against its own design tokens, shared components, navigation and rendered screens. Base commit: `192b544`. No application code was changed. The original Figma file was not supplied or located in the reviewed documentation, so these are confirmed internal inconsistencies and improvement recommendations, **not a verified pixel comparison with Figma**.

46 full-page PNGs cover 23 screens/states at desktop (1440 × 1000 viewport) and mobile (390 × 844 viewport), in English. These include all seven application views, both practice paths, mixed mode, validation/hint/reveal/summary states, Notebook empty/saved/delete states, all three Explore tabs, and both developer showcases. The manifest records image dimensions, horizontal overflow and font availability. All captures loaded Source Sans 3. One capture, mobile Explore → Conjugation, has document-level horizontal overflow; the other 45 did not.

## Prioritized findings

| Priority | Inconsistency and evidence | Suggested improvement |
| --- | --- | --- |
| High | **Mobile conjugation overflows the page.** `mobile-19-explore-conjugation.png` clips the collapse control and right-hand content; the automated document-width check confirms horizontal overflow. The detail grid/table needs constrained shrink behavior. | Constrain grid children with `min-width: 0` and keep horizontal scrolling inside the table wrapper; verify the header action also fits. |
| High | **Mobile translation direction breaks across rows.** `mobile-15-translate-disabled.png` shows Spanish and the arrow on one row, German below. `src/index.css:373` gives `.translator-controls` two columns while `TranslationView.tsx` supplies three children. The desktop grid also retains sizing intended for the older selector controls. | Use a compact three-part language-direction row for the current translation UI, with both languages visually connected by the arrow. |
| High | **Navigation exposes different functionality.** Desktop has Notebook; mobile explicitly filters it out (`src/App.tsx:77`). Explore is accessible only through a saved prototype Notebook card, and the empty Notebook action has no handler. | Decide whether Notebook/Explore belong in this release; expose a consistent route on both layouts or clearly separate prototype previews from working navigation. Wire or disable the empty-state action. |
| High | **Storage and availability messages conflict.** The sidebar says “Saved on this device,” Notebook promises offline entries, and Explore says context is saved; About says saved progress and offline access are planned. The implementation stores only the prototype saved-word boolean and language preference, not editable notebook content. | Use one truthful availability vocabulary across shell, page descriptions and prototype banners. Make persistence claims specific to what is actually stored. |
| Medium | **Two visual styles coexist.** Dashboard/flashcards use custom mint surfaces (`#effbf7`, `#eaf6f3`, `#e3f1ed`), custom shadows and several radii; challenge/translation/Notebook use the shared bordered-card treatment. See captures 01, 02, 12 and 17; `src/index.css:463–526`. | Agree on shared surface, card, badge and elevation variants. Add any intentional learning colors to semantic tokens and demonstrate them in the showcase. |
| Medium | **Content widths and alignment change abruptly.** The dashboard fills the page; challenge settings max out at 760px left-aligned; sessions at 960px; flashcards at 600px centered; Settings at 600px left-aligned; About at 720px. See captures 01, 02, 03, 12–14. | Define intentional wide and focused page layouts with consistent header/content alignment. A smaller flashcard is reasonable, but its positioning should follow an explicit layout rule. |
| Medium | **Exercise hierarchy still reads as a dashboard.** Every challenge retains “Your learning dashboard” and its intro above a back action, reset warning, mode, score and question. Complete-the-verb repeats five sets of keyboards/actions, creating a very tall mobile page. See captures 03 and 09. | Give active exercises a concise task header, compact session metadata and a consistent place for help/scoring details. Preserve clear per-field feedback while reducing repeated explanatory copy. |
| Medium | **Form and feedback styling diverges.** Shared fields use 44px minimum height/default borders, challenge fields use 48px/strong borders, and settings selectors have separate rules. Challenge feedback is plain text; other screens use shared Alert components. See captures 02, 04–06, 13 and the Components showcase; `src/index.css:201`, `449–458`. | Standardize field sizes, label spacing, validation and success/reveal presentation through shared component variants. Keep textual feedback alongside color. |
| Medium | **Learning level labels disagree.** Practice and Flashcards display “German · B2”; About describes the current course as CEFR B1. | Confirm the intended content level and use a consistent, evidence-based label; distinguish learner level from content level if both are intentional. |
| Low | **Header and notice spacing varies.** Settings removes the global locale toolbar, shifting its title upward relative to most screens. About adds a Settings link before its heading. Translation applies the generic prototype notice margins inside the page, causing an inset alert almost touching the translator. | Establish consistent page-header, back-link and notice slots; keep page notices aligned to their associated card. |
| Low | **Dashboard affordances differ for equivalent actions.** Recommended uses a pill with no chevron; the other two paths have rectangular tags and chevrons. Flashcard Previous also overrides the shared secondary button appearance. | Make action affordances consistent and let recommendation status remain a separate badge. Document deliberate button variants. |

## Recommended first improvement milestone

Fix the mobile translation row, establish consistent page/card/form variants, and apply them to Dashboard → Challenge → Flashcards. Resolve navigation and misleading availability copy within a separately agreed scope. Use the original Figma file to decide which visual treatment to keep before changing the palette or broader layout.

## Capture limitations and interpretation

- These are full-page screenshots, not just the first viewport. Fixed mobile navigation appears at the original viewport bottom within tall images; this is capture behavior, not evidence that it sits permanently in the middle of the scrollable page.
- Mobile captures emulate CSS viewport dimensions in desktop Chrome. Physical-device keyboard, touch and safe-area behavior were not tested. Other viewport widths and the other four interface languages were not audited.
- Notebook saved/Explore captures seed the existing `hello-profe-saved` flag in an isolated browser profile. On mobile, Notebook was opened via its hidden desktop button to document the otherwise inaccessible layout. No production data was changed.
- Translation is disabled in the ordinary local preview. Live loading, success, backend errors and rate-limit states are not captured; no AI backend requests were made. This does not imply translation is disabled on the deployed site.
- Exercise selection used a fixed random value for reproducible content. Screens show representative states, not every verb, answer outcome or form/language combination.
- Both design-system pages are developer-only. Their screenshots are reference material, not additional public routes.
- Review combined source inspection, screenshot inspection of key layouts and automated capture metadata checks. No claim is made that every screenshot received an exhaustive accessibility review.

## Files

`desktop-*.png` and `mobile-*.png` share screen numbers for comparison. `index.html` is an offline gallery; click any thumbnail for the original image. `manifest.json` lists all captures and their special setup notes.

## Implemented first milestone

The owner selected the existing Flashcards appearance as the reference because the original Figma file could not be used reliably. The dashboard and challenge screens now share its mint surface and soft card shadow through CSS tokens, rounded white cards, teal form labels and consistent secondary controls. Active exercises show their learning-path title. Flashcards retains its existing appearance.

Eight updated captures are in [flashcard-alignment](flashcard-alignment/): dashboard, challenge setup, single-form question and complete-the-verb question at both audited viewport sizes. All eight passed the document-width check. The original 46 screenshots remain the before-change baseline.

This completes the agreed dashboard/challenge alignment only. Mobile translation layout, Explore overflow, prototype navigation/availability copy and level-label clarification remain open; the audit is not a claim that every inconsistency has been fixed.
