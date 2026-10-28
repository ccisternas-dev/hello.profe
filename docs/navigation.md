# Responsive navigation

Issue #22 adds Translate, Practice, Flashcards, and Settings to the bottom menu below 1200 CSS pixels. This covers phone portrait/landscape and common tablet portrait/landscape widths. At 1200px and above, the sidebar retains Notebook and includes the new Flashcards and Settings destinations.

Flashcards opens the verb reference directly, following the newer verb-only design from PR #24 rather than the issue's original deck-selection wording. Its dashboard card opens the same destination, keeping the selected navigation item consistent. Settings exposes the existing interface-language preference; it persists when browser storage is available. Translate keeps its prototype notice.

Changing destinations unmounts the current learning screen, resetting a challenge or card position. Notices explain this on both learning screens. Selecting the already active destination does not reset it. Navigation moves focus to the main content; selected buttons expose `aria-current="page"` and decorative icons accompany localized text.

The menu reserves bottom safe-area space, with matching content padding and `viewport-fit=cover`. It hides when a focused text editor and a visual-viewport height reduction greater than 150px indicate an on-screen keyboard. It returns when the keyboard closes or focus leaves the editor. The content remains scrollable while editing.

Chrome checks covered five languages at 320×640, 390×844, 844×390, 768×1024, 1024×768, 1180×820, plus desktop at 1280×900. Checks included all destinations, active state, 44px targets, keyboard navigation, saved language, same-tab preservation, destination resets, and bottom-control clearance. Virtual-keyboard resizing was simulated; physical-device keyboard and safe-area testing remains manual.
