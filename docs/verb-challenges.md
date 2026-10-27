# Verb translation challenges

Implements issue #20 for verbs only. The learning dashboard opens with Translation Challenge (single-form or mixed), Complete the Verb (all five supplied forms), and Flashcards (a reading-only reference for 148 verbs). Vocabulary and temporal-connector translation challenges are not part of this change.

## Modes and content

- **Single-form:** choose infinitive, Präsens (er/sie/es), Präteritum (er/sie/es), Perfekt (er/sie/es) or Partizip II. Continue one question at a time until End session.
- **Complete the verb:** translate a cue into every available form, with individual checking, retries, hints and reveal. Correct fields stay locked while other fields remain editable.
- **Mixed:** vary the verb and requested form, avoiding an immediate identical question where possible.

The existing workbook-derived JSON supplies 148 verbs. Four source forms plus the infinitive yield 740 targets. `buildVerbs` maps the existing labelled cards to a typed verb/answer model with stable verb + form keys; it never invents missing forms. Empty forms are excluded, malformed/duplicate data fails validation, and tests audit the entire source dataset. Prompt languages are English, Spanish and French; they are separate from the five UI languages.

`src/data/verb-overrides.json` contains explicit full-string alternatives for five source cells: backen/present, senden/preterite, senden/perfect, senden/participle, ziehen/perfect. Shorthand such as “hat gesandt / gesendet” is expanded explicitly, not split at runtime. The original source strings are retained for those entries; changed source answers fail the audit until reviewed. Accepted answers are canonical plus the named alternatives only; this is not a general-purpose synonym checker.

Cue overrides distinguish overlapping translations with context or German starting letters/prefixes. These qualifiers are part of the question, not a scored hint. They help distinguish the requested workbook verb where translations such as “to begin” describe more than one entry. Flashcards use the original workbook translations without challenge cue qualifiers. Further linguistic review remains tracked under #5.

## Checking, hints and scoring

Answers are NFC-normalized, trimmed and lowercased using German case rules. Internal spaces and punctuation remain meaningful. Umlauts are preserved; `a` does not equal `ä`, and `ss` does not equal `ß` unless an explicit alternative permits it. Empty input is not an attempt. Incorrect responses stay editable without revealing the answer.

The first hint gives the first letter of the canonical answer. The second gives its count of visible letters/digits, excluding spaces and punctuation; `Intl.Segmenter` handles composed characters. Thus “hat angeboten” has 12 counted letters. Hints apply per field and remain compatible with explicitly accepted alternatives.

| Completed answer | Points |
| --- | ---: |
| Correct first time without hints | 3 |
| Correct after one or more incorrect attempts, without hints | 2 |
| Correct with first-letter hint, including retries | 1 |
| Correct with length hint | 0 |
| Explicitly revealed | 0 |

Every question occurrence/field can be scored only once. Duplicate submissions, stale events and editing revealed answers cannot earn extra points. A later question can earn points again as deliberate repeated practice. Hinted and retried summary counts can overlap and are labelled accordingly. Unfinished answers at End session are not scored; points do not claim mastery.

## Adaptive practice

Statistics are keyed by verb ID and exact target form. Wrong attempts add one review priority (capped at five); using a hint sets at least one; reveal adds two. A later unaided correct answer reduces priority by one. Correctly completed/revealed fields increment their coverage count.

Two turns select among least-seen eligible forms; every third turn prioritizes the highest outstanding review priority, falling back to coverage if no review is needed. Ties are randomized. The immediately previous exact task is avoided when another exists. Complete mode avoids the immediately previous verb when possible and updates all five form statistics individually. Single-item pools still work. This balances coverage with revisiting difficulties; it is session-based practice prioritization, not a validated spaced-repetition algorithm.

UI language changes preserve settings, typed answers and scores. Returning to the dashboard or leaving the screen discards the current session, as stated beside the back button. End session shows a summary; Change settings and restart returns to setup and clears the old session. Saved progress, downloaded deck updates and offline reopening remain #11, #13 and #14 respectively. Those features should version the source dataset and its explicit answer/cue overrides together.

## Validation

`pnpm test` includes the full-data audit and tests for alternatives, source drift, case/Unicode/umlaut validation, character insertion, hint lengths, retries, duplicate/stale actions, all score levels, complete-mode field isolation, exact-form prioritization, randomized selection, empty/missing-form/single-item data and session reset. `pnpm i18n:check`, TypeScript and the production build also pass.

Chrome production-preview checks cover the three modes, English/Spanish/French prompts, per-field completion, retry/reveal/score behavior, pointer/keyboard German-character insertion with caret preservation, all five UI languages and desktop/mobile widths. Flashcards now show complete verbs immediately, with Previous/Next navigation and no ratings or reveal actions. Physical-device and independent linguistic validation are not claimed.
