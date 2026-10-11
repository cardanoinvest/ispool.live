# Validation results

Browser: Chromium, headless. Static files served locally.

PASS: 32 combinations of viewport width and language, without horizontal document overflow.
Widths: 320, 360, 390, 650, 768, 850, 1024, 1440 px. Languages: EN, DE, FR, JA.
PASS: API failure state, with unavailable placeholders rather than invented statistics.
PASS: Mobile navigation toggle, hidden-menu inert state, Escape and focus restoration.
PASS: QR dialog focus, explicit Tab wrap, Escape, focus restoration and clipboard feedback.
PASS: Clipboard content matches the complete pool ID.
PASS: QR image decodes to the exact pool ID.
PASS: Range-button selection, table visibility toggle and FAQ disclosure.
PASS: Manual animation pause and reduced-motion preference.
PASS: Relative assets under a GitHub-style /repo/ subpath.
PASS: Blocked localStorage and unavailable IntersectionObserver fallback.
PASS: Core content and mobile navigation without JavaScript.
PASS: Malformed API response rejection.
PASS: JavaScript syntax, CSS parsing, unique IDs, anchors and local asset existence.
PASS: All visible translation keys present in all four languages.
PASS: No uncaught JavaScript errors in the tested interactions after fixes.

LIMITATIONS:
- Live upstream API requests did not complete from this environment. This does not establish that the key is invalid. Successful live statistics and populated-chart integration need a production check.
- No synthetic statistics were used. Preview screenshots intentionally show unavailable API data.
- Safari, Firefox and physical-device testing not performed.
- Not a formal WCAG audit or security penetration test.
- Owner-provided hardware, location and operating-since statements are not independently verified.
