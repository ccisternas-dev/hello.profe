# hello.profe — updated issue plan

Updated: 26 October 2026.

## Goal and current status

Ship a small static German memory trainer using the existing React/TypeScript/Vite interface and three Excel workbooks: irregular verbs, health/friendship vocabulary and temporal connectors with exercises. The first useful interaction is a flashcard: think of the answer, reveal it, then choose “Remembered” or “Again”. A server, SSR, account and database are not required for this release.

The broader goal remains simultaneous translation across languages, followed by richer vocabulary exploration and practice. This study release changes delivery order, not product purpose.

The supplied B2 workbooks have now been inspected and converted: 148 verb rows (592 form cards), 140 health rows, 101 friendship rows, 28 temporal connectors and 56 exercises. English, Spanish and French translations are preserved where supplied. The nine decks contain 917 cards. Verb forms cover third-person singular Präsens, Präteritum, Perfekt, and Partizip II; no additional tense coverage is inferred. See `docs/practice-data-audit.json`.

Completed, based on the owner's report:

- [x] Create/export the Figma Make prototype and import it into the repository.
- [x] Verify the Figma export locally. Existing GitHub issue: https://github.com/ccisternas-dev/hello.profe/issues/3. Preserve actual test evidence; if build/type checks remain, complete them under the validation issue below.

These headings are planning identifiers, not GitHub issue numbers. Record actual issue links after creating or updating issues. Do not recreate the two completed issues.

## Workflow and release scope

- Milestone: **German memory trainer v0.1**.
- Keep one issue In progress. Local implementation and automated validation are complete; browser/device checks and deployment status must be recorded separately. Use Backlog → Ready → In progress → Verify → Done.
- Use small branches from updated `main`, for example `feat/study-decks`, `feat/flashcards` and `ci/github-pages`.
- Merge working increments through pull requests. Include `Closes #<actual-number>` for fully completed issues targeting the default branch.
- Run type/build checks on pull requests; deploy the published study app from `main` through GitHub Actions.
- A temporary `experiment/flashcards` branch is fine for a short investigation. Record the result and merge or discard it; avoid a permanent second implementation.
- GitHub Pages does not automatically provide a separate preview URL for every branch. This repository has one Pages site. A workflow deploying an experimental branch would replace that site's published contents. Use local preview initially; isolate a public sandbox in a separate repository only if needed.
- Bundle JSON with the app. Excel conversion happens during development, not on the visitor's phone. No in-app spreadsheet importer in v0.1.
- Core release: nine structurally validated decks, revealable cards, navigation, shuffle, session-based Again/Remembered review and mobile deployment. Saved progress is optional after that release.
- A static site is not automatically offline-capable. Defer service-worker/PWA work.

## Issue A — Define the static study release and document current limitations

**GitHub:** https://github.com/ccisternas-dev/hello.profe/issues/4


**Why**
Use hello.profe for the upcoming German test without waiting for the translation backend or dictionary pipeline.

**Scope**
Update the README and add `docs/decisions/002-static-study-release.md`. Explain the nine-deck release, the choice of client-side rendering/static hosting, and which prototype features remain simulated. Reuse the existing Figma components instead of redesigning.

**Done when**
- [ ] README distinguishes implemented, simulated and planned functionality.
- [ ] The initial study journey and nine decks are described.
- [ ] Simultaneous translation remains visible in the roadmap.
- [ ] The practice view is accessible without first saving a prototype notebook verb.
- [ ] The plan explicitly excludes APIs, accounts, full dictionary coverage and automatic spaced repetition from v0.1.

**Verification**
Compare documentation with the running app. Record the decision and tradeoff: immediate study utility now, translation integration later. Do not claim public deployment or persistent progress before those work.

**Suggested branch:** `docs/static-study-release`

## Issue B — Audit the Excel tables and define card data

**GitHub:** https://github.com/ccisternas-dev/hello.profe/issues/5


**Why**
Reliable memorisation needs correct prompts, answers and verb-form labels.

**Scope**
Inspect headers and representative rows in the supplied tables. Define a small versioned JSON schema, a matching TypeScript type and the conversion mapping. Confirm which verb forms the course actually requires.

**Done when**
- [ ] Actual columns, row counts and source/review information are recorded for each table.
- [ ] Vocabulary cards distinguish the German term, article/plural when supplied, translation language, meaning and optional example.
- [ ] Verb cards name the exact form/person/tense asked for. Partizip II is a form; Perfekt and Plusquamperfekt are distinct.
- [ ] Each card has a stable unique ID, deck ID, prompt, answer and optional explanatory fields.
- [ ] A verb row can produce separate cards for different forms; a missing form does not become a scored question.
- [ ] Incomplete/ambiguous rows and duplicate handling have explicit rules.
- [ ] Only learning material suitable for public publication is included; private details and content without suitable reuse permission are excluded or replaced with original examples.

**Verification**
Manually map at least two representative rows per table, including an irregular verb and German special characters. Compare their card answers with the course reference. Keep unresolved rows out of the published decks.

**Depends on:** A. **Suggested branch:** `feat/study-data-schema`

## Issue C — Convert and validate the study decks

**GitHub:** https://github.com/ccisternas-dev/hello.profe/issues/6


**Why**
Provide lightweight content that the browser can load without Excel or a server.

**Scope**
Export tables to UTF-8 CSV and use a development-time conversion script to produce JSON, or document an equally repeatable conversion. Keep raw source files outside the web bundle; include them in Git only if appropriate for public sharing. Do not add a browser Excel-processing dependency.

**Done when**
- [ ] The nine decks in `src/data/study-decks.json` follow the agreed schema.
- [ ] Required fields, unique IDs and valid deck references are checked.
- [ ] Accepted rows and generated card counts are reconciled; rejected rows are reported rather than silently lost.
- [ ] Empty cells do not become `undefined`, `NaN` or misleading answers.
- [ ] Umlauts, ß, accents and multiline examples survive conversion.
- [ ] README documents how to regenerate the data when Excel changes.

**Verification**
Convert twice and confirm stable IDs and consistent output. Compare sample cards with source rows. Deliberately introduce a missing answer and duplicate ID to confirm validation fails clearly.

**Depends on:** B. **Suggested branch:** `feat/study-decks`

## Issue D — Build deck selection and a revealable flashcard

**GitHub:** https://github.com/ccisternas-dev/hello.profe/issues/7


**Why**
Start studying immediately with a small, focused interface.

**Scope**
Reuse the existing practice view and components. Select a deck, show one prompt and reveal its answer on demand. Import the checked JSON directly.

**Done when**
- [ ] Users can choose irregular verbs, Freundschaft, Gesundheit, temporal connectors or one of five exercise decks and see available card counts.
- [ ] A selected deck opens at its first card with the answer hidden.
- [ ] Reveal shows the answer and relevant article/plural, forms or example only where available.
- [ ] Next/Previous navigate safely; answers hide when changing cards or decks.
- [ ] “Card X of Y” reflects real deck content.
- [ ] Empty data has a useful message; the existing translation prototype remains clearly labelled.

**Verification**
Open all nine decks, reveal cards, change decks and test first/last-card behaviour. Compare displayed content with the JSON. Verify buttons work by keyboard and at a narrow mobile width.

**Depends on:** C. **Suggested branch:** `feat/flashcards`

## Issue E — Add recall feedback, shuffle and an Again review queue

**GitHub:** https://github.com/ccisternas-dev/hello.profe/issues/8


**Why**
Make the trainer encourage active recall and repetition rather than passive sliding through words.

**Scope**
After reveal, allow “Remembered” or “Again”. Track one study session in memory, provide shuffle and repeat the Again set. This is self-assessment, not automatically verified accuracy or spaced repetition.

**Done when**
- [ ] Assessment buttons appear only after reveal.
- [ ] Each first-round card is counted once; repeated clicks cannot inflate totals.
- [ ] A card marked Again enters the review queue once.
- [ ] The summary uses real counts and labels them as self-assessment.
- [ ] Review starts from the Again set and can be repeated until finished or stopped.
- [ ] Shuffle produces a permutation without losing or duplicating cards.
- [ ] Restart resets the session; no score is hardcoded.

**Verification**
Complete all-Remembered, all-Again and mixed sessions. Test repeated submissions, empty review queue, one-card decks and restart. Add focused tests for queue/count logic and shuffle membership rather than asserting a particular random order.

**Depends on:** D. **Suggested branch:** `feat/recall-review`

## Issue F — Validate the static release on desktop and mobile

**GitHub:** https://github.com/ccisternas-dev/hello.profe/issues/9


**Why**
Make the study app reliable and comfortable to use before publishing it.

**Scope**
Check the new practice flow, resolve blocking errors, and keep prototype-only controls from implying completed features. Retain the existing design system; change only what study usability needs.

**Done when**
- [ ] TypeScript check and production build pass.
- [ ] Card answers remain hidden until reveal and focus is visible.
- [ ] Long words, examples and verb forms fit at approximately 390px width without clipped controls.
- [ ] Keyboard access and readable contrast are checked; reduced-motion preferences are respected for any transitions.
- [ ] The production preview opens and refreshes without console errors.
- [ ] Missing data and repeated actions do not crash the app.
- [ ] Node and pnpm versions and reproducible commands are recorded.

**Verification**
Run the commands that previously worked, using the project's pinned pnpm version:

```bash
npx --yes pnpm@10.34.3 install --frozen-lockfile
npx --yes pnpm@10.34.3 exec tsc --noEmit
npx --yes pnpm@10.34.3 build
npx --yes pnpm@10.34.3 preview --host 127.0.0.1
```

Record actual results in the issue. Use a supported Node version aligned with the repository and CI; do not record the planned version as if tested. Desktop emulation does not replace the Android check after deployment.

**Depends on:** E. **Suggested branch:** `fix/study-release-validation`

## Issue G — Deploy the study release to GitHub Pages

**GitHub:** https://github.com/ccisternas-dev/hello.profe/issues/10


**Why**
Study on Android and Mac through a shareable static URL without running the development server.

**Scope**
Configure GitHub Actions to build Vite and publish `dist` from `main`. Preserve the pnpm lockfile and avoid the older source-branch approach for unbuilt React files.

**Done when**
- [ ] Repository Settings → Pages uses GitHub Actions.
- [ ] The build uses a pinned supported Node version and pnpm 10.34.3 with the existing lockfile.
- [ ] Type-check/build checks run on pull requests; deployment runs only for the intended `main` release, not every experimental branch.
- [ ] The Pages deployment job has the required Pages permissions, environment and concurrency settings from the official template.
- [ ] Vite's deployed base is `/hello.profe/` for this repository's default Pages URL. Existing `FIGMA_PUBLIC_URL` behaviour is reviewed so it cannot override that accidentally.
- [ ] Asset and data paths work under the repository subpath. Bundled JSON imports avoid hardcoded root-relative data URLs.
- [ ] Navigation stays in-page for v0.1, or uses hash routing; direct URL refresh does not depend on server-side route rewrites.
- [ ] Required Figma config files, including `.figma/make/site.json` while imported, remain available to the build.
- [ ] The published trainer is usable on Android and Mac, with no broken assets or private data in the bundle.
- [ ] README links the actual site and documents publishing behaviour.

**Verification**
Inspect a successful Actions run, then open the deployed URL on both devices. Load every deck, reveal answers, review Again cards and reload the page. Confirm branch-only changes do not change the live site. Do not claim offline support: it requires separate work.

**Depends on:** F. **Suggested branch:** `ci/github-pages`

**Reference:** https://vite.dev/guide/static-deploy/#github-pages

## Issue H — Optional: save study progress locally

**GitHub:** https://github.com/ccisternas-dev/hello.profe/issues/11


**Why**
Resume useful review after refresh without adding accounts or cloud storage.

**Scope**
Save a small versioned state in localStorage: selected deck and remembered/Again IDs. Store study data only, with no sensitive information. Implement after the first public trainer if exam time is limited.

**Done when**
- [ ] Progress restores after refresh on the same browser/device.
- [ ] Data is versioned and reconciled against current card IDs.
- [ ] Corrupt, unavailable or outdated browser storage does not crash the app.
- [ ] A clear-progress action resets state with confirmation.
- [ ] UI explains that progress is local, not synced, and can be cleared by the browser.

**Verification**
Reload, clear storage, insert malformed saved data and update a deck. Verify safe recovery and correct reset. Confirm another browser does not appear to share progress.

**Depends on:** E. **Suggested branch:** `feat/local-study-progress`

## Existing issues to update rather than duplicate

| Previous issue | Revised treatment |
| --- | --- |
| Document implemented and simulated behaviour | Fold into A |
| Prepare a small German dataset | Replace its scope with B and C, linking their actual issue numbers |
| Display/check practice questions | Deliver revealable cards first under D; defer typed-answer marking |
| Calculate real results and review mistakes | Adapt to self-assessed recall under E |
| Functional source/target selection | Keep open in the translation backlog |
| Connect simultaneous translation | Keep open in the translation backlog; not part of the static study release |

Do not close unfinished work as completed merely because priorities changed. Edit and relabel it, or close as not planned only if actually abandoned, with an explanation and replacement links.

## Later backlog — preserve the wider product

- Typed-answer mode with accepted alternatives, umlaut/accent rules and checked grammar explanations.
- Vocabulary direction toggle where the source tables support it.
- Simultaneous translation controls and a replaceable provider adapter. GitHub Pages can host the frontend; credentials and protected API calls require a separate backend or another suitable architecture.
- Word meanings, articles, plurals, synonyms and verified conjugations across supported languages.
- Vocabulary notebook and validated export/import.
- Spanish activities for children, expanded language coverage and Dutch.
- Offline/PWA caching, richer progress and spaced repetition after the simple recall loop is useful.

## Portfolio evidence

For each pull request: link the issue, explain the need, show the changed behaviour and record the checks. Capture one concrete improvement from real study sessions. Use claims such as “self-reported recall” rather than asserting measured mastery or learning effectiveness.

Keep this file as the roadmap and GitHub Issues as the source of live status. Add actual issue links here rather than duplicating all discussion in both places.
