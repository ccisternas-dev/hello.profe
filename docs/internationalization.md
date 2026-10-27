# Interface languages

Issue: [#15](https://github.com/ccisternas-dev/hello.profe/issues/15).

The interface supports English (`en`), French (`fr`), Dutch (`nl`), German (`de`) and Spanish (`es`). The language selector is available above every screen. On first use, the app chooses the first supported browser language (including regional variants such as `fr-BE` and `es-MX`), or English. An explicit choice is stored under `hello-profe-ui-locale`. Invalid or blocked storage is handled safely, independently of notebook or study-progress storage.

Language changes update the existing React tree. They do not reset a selected deck, visible answer, ratings, round, selected tab or entered text. The document language, title, description and Open Graph text follow the interface language. Static HTML and metadata remain English before JavaScript runs; this static release does not provide separate server-rendered locale URLs.

## Adding interface text

1. Add an English message key and value in `src/locales/en.json` and translations with the identical key in `fr.json`, `nl.json`, `de.json` and `es.json`. Keys are complete source messages; changing a key requires updating every catalogue and its call sites.
2. Call `useI18n()` inside the component and render `t("Your complete message")`. Translate text props, accessibility labels, errors and loading states as well as visible text. `MessageKey` provides compile-time checking, including labels held in arrays or metadata.
3. Interpolate complete sentences: `t("Card {current} of {total}", { current, total })`. Numeric parameters use the active locale's `Intl.NumberFormat`. Do not concatenate sentence fragments.
4. For quantities, use `plural(oneKey, otherKey, count, values)`. `Intl.PluralRules` selects the form, including French zero. Use the locale for any future date formatting; prototype “updated today” copy is not a real timestamp.
5. Run `pnpm i18n:check`, `pnpm test`, `pnpm typecheck` and `pnpm build`.

No new runtime dependency is needed. Translation resources are bundled with the application: switching among all five languages requires no translation network request. English messages are the fallback for an absent selected-locale entry; CI rejects absent entries before release.

## Learning content and technical identifiers

UI language is independent of study language and the prototype's source/target selections. Supplied German prompts, verb-form labels, hints, answers and examples remain unchanged, as do supplied English, Spanish and French learning translations. Their `lang` attributes indicate the actual content language. German course hints are learning content, not application instructions.

`deckMessages` in `src/StudyPractice.tsx` maps stable deck IDs to localized display titles and complete exercise instructions. The English “Model answer” explanation is application text and is localized. Display language changes never alter card IDs, answers or the original JSON. Native names in the interface-language selector remain in their respective languages so learners can recognize them. Product names and literal CSS token names are not translated.

The source audit rejects raw JSX text, untranslated text attributes, literal template/concatenated messages, unknown translation keys and unreviewed direct dynamic text. `scripts/i18n-exceptions.json` lists exact preserved learning examples, brand text and code identifiers with reasons. `scripts/i18n-dynamic-content.json` records reviewed data/component-prop outputs by file and expression. Review these exceptions whenever data flows change; they are not a replacement for checking the rendered interface. Do not add ordinary UI messages to the exception lists.

## Offline/PWA coordination

Issues #13 and #14 remain separate. Their future download, update and installation messages must use this same catalogue system. The PWA shell should cache the application assets that already contain all locales. This change verifies language switching without network access after the app has loaded; it does not implement offline reopening, downloads or installation.

## Validation

- 279 message keys in each of five catalogues, with complete keys and matching interpolation parameters.
- Unit checks: browser-language detection, saved-preference priority, fallback, locale-aware numbers/plurals and source-audit rejection cases; existing study-session tests still pass.
- The original PR's Chrome checks at 1280px and 390px covered the four languages it introduced, all nine decks and all six screens. The Spanish addition is covered by the locale-detection, catalogue-completeness, interpolation/plural and production-build checks. The original browser checks covered empty/error states, dialogs, notifications, tabs, metadata and lack of horizontal overflow.
- Switched languages while an answer was visible and during a complete study/review round; cards, ratings and review state were preserved.
- Checked preference restoration, corrupt/blocked storage and offline locale switching. No browser errors or failed application HTTP requests.
- Translations were reviewed for consistent labels and interpolation. Native-speaker editorial feedback can refine wording without code changes. Browser checks use emulation, not a physical Android device.
- Spanish follow-up: Chrome checks passed for `es-MX` detection, the Español selector option, preference restoration, page metadata, card/answer/rating preservation across language changes and layouts at 1280px and 390px. No browser errors.
