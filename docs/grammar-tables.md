# Grammar tables

Reference tables for German grammar on their own page, **Grammar** (`#grammar`). It's in the desktop sidebar and the mobile bottom menu. A topic can be linked directly, for example `#grammar/adjectives`.

## Content

`src/data/grammar-tables.json` holds 11 tables, each labelled with `language` (`de`, shown as "German"), a CEFR `level` and a `topic`:

| Topic | Tables | Level |
|---|---|---|
| Articles | Definite and indefinite articles across Nominativ, Akkusativ, Dativ and Genitiv, for masculine, feminine, neuter and plural | A1 |
| Personal pronouns | Nominativ, Akkusativ, Dativ and the possessive article for every person, including formal Sie | A1 |
| Prepositions | Akkusativ, Dativ, two-way (Wo? and Wohin?) and Genitiv prepositions, with examples | A2 |
| ADUSO | aber, denn, und, sondern, oder: position 0, with examples | A2 |
| Adjective endings | After der/die/das, after ein/kein/mein, and without an article | B1 |
| Connectors | Subordinating (verb at the end), adverbial (verb in position 2) and two-part connectors | B1 |

Table content is German. Titles and notes are translated into the five interface languages. In cells, `[…]` marks the part to highlight (an ending, a changed form or the conjugated verb). Highlights use bold as well as colour, plus an underline in print.

The owner (ccisternas-dev) approved all tables on 18 November 2026 before review, choosing to correct them later if needed. They are published with `reviewed: true`. Unreviewed tables, if any are added, are hidden by `filterGrammarTables`.

## Printing

- **Print this table** prints a single table.
- **Print shown tables** prints whatever the current filters show.

The print stylesheet uses A4 with 15 mm margins. It hides the navigation, filters and footer, forces black on white in either theme, and keeps each table on one page. No PDF library is involved.

## Validation

`scripts/grammar-tables.test.mjs` checks:

- table structure: unique IDs, labels, equal row lengths, no empty cells and balanced highlights;
- that all four cases are present;
- translations of titles and notes in every interface language;
- the language and topic filters.
