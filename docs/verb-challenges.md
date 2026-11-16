# Verb translation challenges

Implements issue #20 for verbs only. The learning dashboard opens with Translation Challenge (single-form or mixed), Complete the Verb (all five supplied forms), and Flashcards (a reading-only reference for 148 verbs). Vocabulary and temporal-connector translation challenges are not part of this change.

## Modes and content

Both challenges start immediately when chosen on the dashboard; there is no setup screen. Translation Challenge options (single-form or mixed, and the target form) are on the Settings page, saved in this browser, with defaults of single-form and Infinitive. Changing them restarts a challenge in progress. Prompts use the interface language when cues exist in it (English, Spanish or French) and English otherwise.

- **Single-form:** practise the target form chosen in Settings: infinitive, Präsens (er/sie/es), Präteritum (er/sie/es), Perfekt (er/sie/es) or Partizip II. Continue one question at a time until End session.
- **Complete the verb:** translate a cue into every available form, with individual checking, retries and reveal. Correct fields stay locked while other fields remain editable.
- **Mixed:** vary the verb and requested form, avoiding an immediate identical question where possible.

The existing workbook-derived JSON supplies 148 verbs. Four source forms plus the infinitive yield 740 targets. `buildVerbs` maps the existing labelled cards to a typed verb/answer model with stable verb + form keys; it never invents missing forms. Empty forms are excluded, malformed/duplicate data fails validation, and tests audit the entire source dataset. Prompt languages are English, Spanish and French; the prompt follows the UI language when it is one of them.

`src/data/verb-overrides.json` contains explicit full-string alternatives for five source cells: backen/present, senden/preterite, senden/perfect, senden/participle, ziehen/perfect. Shorthand such as “hat gesandt / gesendet” is expanded explicitly, not split at runtime. The original source strings are retained for those entries; changed source answers fail the audit until reviewed. Accepted answers are canonical plus the named alternatives only; this is not a general-purpose synonym checker.

Cue overrides distinguish overlapping translations with context or German starting letters/prefixes. These qualifiers are part of the question, not a scored hint. They help distinguish the requested workbook verb where translations such as “to begin” describe more than one entry. Flashcards use the original workbook translations without challenge cue qualifiers. Further linguistic review remains tracked under #5.

## Checking and scoring

Answers are NFC-normalized, trimmed and lowercased using German case rules. Internal spaces and punctuation remain meaningful. Umlauts are preserved; `a` does not equal `ä`, and `ss` does not equal `ß` unless an explicit alternative permits it. Empty input is not an attempt. Incorrect responses stay editable without revealing the answer.

There are no hints (removed on 16 November 2026). A learner who does not know an answer can reveal it for that field.

| Completed answer | Points |
| --- | ---: |
| Correct first time | 3 |
| Correct after one or more incorrect attempts | 2 |
| Explicitly revealed | 0 |

Every question occurrence/field can be scored only once. Duplicate submissions, stale events and editing revealed answers cannot earn extra points. A later question can earn points again as deliberate repeated practice. Unfinished answers at End session are not scored; points do not claim mastery.

## Adaptive practice

Statistics are keyed by verb ID and exact target form. Wrong attempts add one review priority (capped at five); reveal adds two. A later unaided correct answer reduces priority by one. Correctly completed/revealed fields increment their coverage count.

Two turns select among least-seen eligible forms; every third turn prioritizes the highest outstanding review priority, falling back to coverage if no review is needed. Ties are randomized. The immediately previous exact task is avoided when another exists. Complete mode avoids the immediately previous verb when possible and updates all five form statistics individually. Single-item pools still work. This balances coverage with revisiting difficulties; it is session-based practice prioritization, not a validated spaced-repetition algorithm.

UI language changes preserve typed answers and scores, and switch the prompt language when cues exist in the new language. Returning to the dashboard or leaving the screen discards the current session, as stated beside the back button. End session shows a summary; Start a new challenge clears the old session and starts again with the current settings. Saved progress, downloaded deck updates and offline reopening remain #11, #13 and #14 respectively. Those features should version the source dataset and its explicit answer/cue overrides together.

## Validation

`pnpm test` includes the full-data audit and tests for alternatives, source drift, case/Unicode/umlaut validation, character insertion, prompt-language selection, saved Translation Challenge preferences, retries, duplicate/stale actions, all score levels, complete-mode field isolation, exact-form prioritization, randomized selection, empty/missing-form/single-item data and session reset. `pnpm i18n:check`, TypeScript and the production build also pass.

Chrome production-preview checks cover the three modes, English/Spanish/French prompts, per-field completion, retry/reveal/score behavior, pointer/keyboard German-character insertion with caret preservation, all five UI languages and desktop/mobile widths. Flashcards now show complete verbs immediately, with Previous/Next navigation and no ratings or reveal actions. Physical-device and independent linguistic validation are not claimed.

## Local Dutch and English B2 drafts

In development, Practice now has a Training language selector for German, Dutch and English. This setting is independent of the interface locale and translation source/target. Choose the language before opening Translation Challenge or Complete the Verb. Leaving a session resets its state as before. Flashcards continues to open the separate topic catalog.

`src/data/b2-verb-training.json` contains 20 original verbs per new language, each with five forms (100 answer targets per language): bare infinitive, third-person singular present, past, present perfect including auxiliary, and past participle. Omit the subject when answering. English cues are Spanish or French; Dutch cues are English, Spanish or French. Dutch separable forms use main-clause order, for example `biedt aan`. The drills target B2 vocabulary consolidation, not a complete B2 curriculum or certified CEFR assessment.

The generated content is explicitly unreviewed. Both new trainers are development-only pending owner review; the previous approval for existing flashcard decks does not approve this new content. No deployment is required to use them locally. Review the JSON's cues and forms before enabling production access.

Grammar references consulted: [British Council irregular verbs](https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/irregular-verbs) and [Dutch Grammar: present perfect](https://www.dutchgrammar.com/en/?n=Verbs.re13). These support form conventions, not a claim that every selected verb is individually classified as B2. New tests cover complete datasets, all prompt/form combinations, scoring, progression, Dutch separable forms and auxiliaries, and English compound forms.
