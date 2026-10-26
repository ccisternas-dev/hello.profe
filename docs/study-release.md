# Static German practice release

## Decision

Reuse the React practice screen with bundled JSON and static GitHub Pages hosting. This provides immediate study content without a backend. Simultaneous translation stays on the wider roadmap. There is no automatic grading, learning-effectiveness claim, saved progress or offline service worker.

## Data contract and provenance

`src/data/study-decks.json` has `schemaVersion: 1` and a `decks` array. Each deck has an ID, title and cards. Cards have a stable ID (hash of deck, German prompt and form), deck reference, nonempty prompt/answer, optional detail, named en/es/fr translations and source workbook/sheet/row. IDs survive row reordering; editing a German term changes its identity. Duplicate card identities fail conversion rather than being silently merged.

The sources are owner-supplied B2 spreadsheets. This conversion checks structure and faithful mapping, not independent linguistic correctness or dictionary coverage. No external course reference was supplied. Raw workbooks, typed user responses, spreadsheet scoring formulas and metadata are excluded from the web bundle. Supplied learning examples and translations are included as requested.

Verb headers: #, Infinitiv, Präsens (er/sie/es), Präteritum (er/sie/es), Perfekt (er/sie/es), Partizip II, English, Español, Français. Each source row creates four precisely labelled cards; missing answers stop conversion for review.

Vocabulary headers: #, Kategorie, Deutsch, Plural / Formen, English, Español, Français, Beispielsatz (Deutsch). The German term (including supplied articles) is the prompt; translations, forms and examples appear after reveal. A dash in forms is omitted rather than invented.

Temporal overview: #, Typ, Konnektor, Funktion, English, Español, Français, Wortstellung, Zeitform / Hinweis, Beispielsatz. Cards ask for the connector's function and show word-order notes, translations and examples. Exercise prompts join the Lösungen sheet by exercise name and question number. Missing or unmatched answers fail conversion. Exercises 4–5 explicitly show model answers; other formulations may be valid.

Notes/instruction sheets, titles and header rows are deliberately excluded. No learning rows were rejected in the supplied files. Unicode is preserved in UTF-8 JSON. See the audit JSON for accepted rows and generated card counts. Correct ambiguous content in the source and regenerate; do not silently substitute unverified answers.

## Checks performed

- Conversion: 917 cards across nine decks, all exercise answers matched.
- Structural validation rejects missing answers and duplicate IDs.
- Session tests cover reveal gating, duplicate/stale submissions, review queues, restart, navigation bounds and shuffle membership.
- TypeScript and Pages production build pass on local Node 25.5.0. CI uses Node 22.22.0; local Node version is not represented as a CI result.
- Language accuracy and physical Android/Mac interaction still need owner review.

Workflow follows the [Vite GitHub Pages deployment guide](https://vite.dev/guide/static-deploy.html#github-pages).
- Headless Chrome production preview passed at 1280px and 390px: all nine decks, reveal/reset on navigation, full mixed round and Again review, refresh and keyboard activation. No page errors, failed HTTP responses or horizontal overflow. This is browser emulation, not a physical Android test.
- Repeating conversion produced byte-identical JSON and stable IDs.
