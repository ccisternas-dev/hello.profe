# Design system showcase

Issue: [#18](https://github.com/ccisternas-dev/hello.profe/issues/18).

## Developer preview

Install project dependencies, then run `npx --yes pnpm@10.34.3 dev:design`. Vite opens the Foundations showcase at `http://localhost:8443/?design-system=foundations`. Use its navigation to open Components, or use `?design-system=components`. If you supply a different port, use that port in the URLs.

The regular development URL `/` still opens the learning app. The query parameter is checked only when `import.meta.env.DEV` is true. The showcase module is lazily imported in development and removed from production JavaScript by Vite. Supplying the same query parameter to a production build does not activate the showcase.

`src/DesignSystem.tsx` retains the Foundations and Components demonstrations, including their interactive states and translations. `src/components.tsx` contains the reusable components and shared page header. `src/index.css` retains design tokens and styles. Nothing needs separate hosting.

## Refresh the README screenshots

1. Start the developer preview and select English for consistent documentation screenshots.
2. Set the browser viewport to 1280 × 900, then open `?design-system=foundations` and wait for fonts/content to finish loading.
3. Use the browser's full-page screenshot command (for example, Chrome DevTools → Run command → Capture full size screenshot). Save it as `docs/images/design-system-foundations.png`.
4. Open `?design-system=components`. Keep the default demonstration states and dismiss any transient toast. Capture the full page as `docs/images/design-system-components.png`.
5. Inspect both images and the README rendering. Commit screenshots alongside relevant design changes. Keep the README alternative text in sync if the illustrated content changes.

The images are documentation assets, outside `public/`, and are not added to the deployed learning app.

## Validation

- TypeScript checks the retained developer views as well as the public app.
- The translation audit covers the extracted module and all five catalogues. Reviewed CSS token outputs moved with the showcase in `scripts/i18n-dynamic-content.json`.
- Chrome verified both developer views and their interactive navigation/notification, then captured the screenshots.
- Production preview checked at 1280px and 390px in all five languages: no Foundations, Components or design-system shortcuts in the DOM/accessibility controls; the developer query parameter does not activate them. Keyboard reveal, recall rating, next-card navigation and layout checks passed without browser errors.
- Production JavaScript was checked for absence of the showcase's distinctive component markup. Shared components and styles remain available to the learning app.
