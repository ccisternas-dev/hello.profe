# hello.profe

Translate, explore words, and practise verb conjugations across five languages.

**Status: planning.** This README describes the intended product. The application, installation workflow and live demo have not been implemented or verified yet.

## About

hello.profe is a personal language-learning companion for Spanish, German, English, French and Dutch. It brings short-text translation, vocabulary exploration and verb practice into one workflow:

**Translate → explore → save → practise.**

The project is also a developer portfolio project. It builds on my experience developing WordPress websites while I explore React, TypeScript and application development, including API integration, data modelling and testing.

## Personal inspiration

Since moving abroad and building a multilingual family, switching between languages has become part of my everyday life. I did not grow up speaking several languages, so learning them has taken—and still takes—a lot of time, effort and practice. hello.profe grows out of that experience: I want to build a companion for the moments when I need to find a word, understand how it works or practise until it feels more familiar. It brings together two things I keep learning: languages and web development.

Spanish is my native language, and I keep learning English, French and German. I also want to pass Spanish on to my children while raising them in Brussels, where French and Dutch are part of our surroundings.

## Current delivery priorities

The long-term goal remains simultaneous multilingual translation with vocabulary exploration and practice across all five languages. The first translation release will focus on Spanish, French, German and English; Dutch remains in the roadmap.

My immediate learning need is German at B1 level, particularly vocabulary about **Freundschaft** and **Gesundheit** and verb forms required for my test. A small practice module using checked local content can support that need while the translation interface develops. Its exact tense coverage will follow the course requirements: Präsens, Perfekt and Plusquamperfekt are distinct, and Partizip II is a verb form rather than a tense.

This changes the order of implementation, not the product's multilingual purpose. Exam practice should stay small enough to support study rather than delay it; it does not require accounts, a translation API or a complete dictionary pipeline.

## Why hello.profe?

“Profe” is a warm, informal way to address a teacher in Spanish, used regardless of the teacher's gender. For me, it also evokes a tutor or mentor: someone approachable who adapts to the learner. Paired with “hello,” it reflects the welcoming, personal spirit I want the app to have.

## Who it is for

Language learners who want to compare vocabulary across languages, understand how a word behaves and practise using it. The focus is individual words, sentences and short paragraphs rather than document translation.

Example journeys:

- Translate a short French sentence into English, German and Dutch in one action.
- Explore a German noun's meaning, article, gender and available synonyms.
- Save a Spanish verb and practise its present-tense forms later.

## Planned features

All features below are planned, not completed.

| Area | Initial scope |
| --- | --- |
| Translation | Explicit source language; one or several target languages; proposed 1,000-character limit |
| Word exploration | Lemma, part of speech, meanings, article/gender where relevant, available synonyms and source attribution |
| Conjugations | A documented selection of common verbs and present-tense forms, expanded after data validation |
| Vocabulary notebook | Save words and personal examples; filter by language; export/import JSON |
| Practice | Select language and tense; type a conjugated form; receive feedback; revisit mistakes |
| Device support | Responsive web interface, followed by PWA installation on compatible Android and Mac browsers |
| Offline access | Saved vocabulary and bundled practice data; new translations require internet |

Language coverage will be published explicitly. A missing dictionary field will be shown as unavailable rather than inferred. General language support does not imply complete conjugation or synonym coverage.

## Product principles

- **Context matters.** Separate meanings and allow an optional example sentence for ambiguous vocabulary.
- **Grammar needs evidence.** Use checked lexical data for gender and conjugation answers. Label any future generated explanations separately.
- **Failure is part of the interface.** Show per-language errors and allow retries without discarding successful results.
- **Keep the budget controlled.** Target free hosting and limited free inference; stop gracefully when quotas are reached.
- **Keep personal learning data local initially.** No account or automatic cross-device sync in the first release. Export/import provides manual transfer.
- **Design for access.** Support keyboards, clear focus states, readable feedback and small screens.

## Proposed architecture

| Layer | Proposed technology | Purpose |
| --- | --- | --- |
| Frontend | React, TypeScript, Vite | Application interface and typed state |
| Styling | CSS / CSS Modules | Responsive, accessible presentation |
| Backend | Cloudflare Worker in TypeScript | Validate inputs, enforce quotas and call providers |
| Hosting | Cloudflare Workers Static Assets | Serve frontend and API from one origin |
| Translation | Provider adapter; evaluate Workers AI M2M100 first | Keep provider choice replaceable and evidence-based |
| Lexical data | Curated Wiktionary/Kaikki subset, subject to audit | Sourced vocabulary and conjugation information |
| Storage | IndexedDB | Vocabulary and practice history on each device |
| Offline / installation | Web app manifest and service worker | Installable interface and offline learning assets |
| Testing | Vitest, React Testing Library; selected Playwright flows | Verify answer checking, interactions and critical journeys |
| Planning | GitHub Issues, Projects and pull requests | Track decisions, implementation and verification |

The translation provider and data pipeline remain open decisions until feasibility testing is complete. Translation and lexical lookup are separate services. API credentials stay server-side; browser bundles must never contain secrets.

## Scope boundaries

The initial release excludes document uploads, OCR, speech recognition, native Android/macOS packages, accounts, automatic cloud sync, complete tense coverage and advanced spaced repetition. The interface will initially use English; translation-language support is separate from interface localisation.

## Roadmap

- [ ] Validate translation quality, free-plan access and grammar-data coverage.
- [ ] Release a short-text translation prototype with multiple targets.
- [ ] Add sourced word details and a local vocabulary notebook.
- [ ] Add a small, reliable conjugation practice loop.
- [ ] Add PWA behaviour and verify Android/Mac use.
- [ ] Publish the portfolio case study and document remaining limitations.

See [BUILD_GUIDE.md](BUILD_GUIDE.md) for the implementation sequence, estimates and completion criteria.

## Development status

There are no runnable application setup instructions yet. After scaffolding, replace this section with tested prerequisites, install commands, environment configuration, development commands and checks. Add a live demo link only after deployment.

## Quality, privacy and cost

Translations can be inaccurate, especially for isolated words. The evaluation will cover all 20 directions between the five languages and include ambiguous vocabulary, irregular verbs and short paragraphs.

Saved learning data is intended to stay on the device initially. Text submitted for translation will be sent to the configured provider through the backend. Before launch, document that provider's data handling, avoid logging raw input and provide controls to clear local data. Browser data may be cleared or evicted; exports are the user's backup.

The operating-cost target is €0 within free allowances, not unlimited free service. Recheck provider terms and quotas before deployment. A custom domain is optional; the project name does not imply ownership of hello.profe.

## Development process and AI assistance

I use the free version of Figma Make to develop the logotype and design system. This is part of exploring how AI-assisted design can support the project within a limited budget.

Important decisions will record the problem, options, evidence, choice and consequences in `docs/decisions/`. Issues will contain acceptance criteria; pull requests will explain changes and validation.

AI assistance, when used, will be documented honestly where relevant. Generated code and language content require review and appropriate verification. Claims of quality will be supported by examples or measured results.

## Licensing and attribution

A code licence has not been selected yet; this README does not grant one. Before publishing reusable dictionary data, document the exact dataset versions, sources, attribution and applicable licence obligations. Code licensing and third-party data licensing must be tracked separately.

## Reference documentation

- [React](https://react.dev/learn)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Vite](https://vite.dev/guide/)
- [Cloudflare React + Vite](https://developers.cloudflare.com/workers/framework-guides/web-apps/react/)
- [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Kaikki machine-readable dictionaries](https://kaikki.org/dictionary/index.html)