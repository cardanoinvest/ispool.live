# Switzerland Investment Pool [000] | Premium static rebuild

## Recommendation
A restrained Swiss editorial identity: deep navy, champagne gold, generous spacing, serif headlines and clear technical information. The golden coded network emblem is retained and enlarged. Green is limited to the non-custodial shield and successful data-status text. A warm light delegation section breaks up the long dark page and makes the main action easy to find.

## Deploy
1. Back up your current publishing folder or commit the existing version first.
2. Extract this ZIP. Upload ALL website files below into the same existing GitHub Pages publishing folder, replacing files with matching names.
3. Keep your existing CNAME and GitHub Pages domain/publishing settings. This ZIP deliberately does not replace your CNAME.
4. Check the deployed page: live data, each language, QR, copy ID, mobile menu and external wallet links.

Website files:
- index.html
- styles.css
- app.js
- config.js
- locales.js
- favicon.svg
- pool-qr.png
- 404.html
- robots.txt
- sitemap.xml
- .nojekyll

No npm, framework, build pipeline, server, serverless function or new CDN dependency is required. Upload the files themselves, not a containing ZIP or an extra parent folder. The scripts/styles are separate now, so replacing only index.html is NOT sufficient.

## What changed
- Completely rebuilt hierarchy, header, hero, statistic strip, principles, performance panel, operator/hardware area, delegation guide, FAQ and footer.
- Gold SVG/CSS network graphic, pause control, offscreen animation pause and reduced-motion support.
- Native QR dialog with keyboard wrap, focus return, copy feedback and local QR download. No external QR service/library.
- 10/20/30 epoch controls, keyboard-readable bars and a matching data table. Chart only appears with valid API history; zero-block epochs have zero-height bars.
- Live stake, delegators, lifetime blocks, saturation, margin, fixed cost and declared pledge read from the API. Correct declared_pledge field used. No estimated APY/ROA or earnings calculator.
- Independent pool/history request states, ten-second request timeout, five-minute browser request cache and manual refresh cooldown.
- Fetch timestamps distinguish updated and cached data. An already open page can retain an older response; it remains labelled with its original time. Reload or refresh to request new data.
- All four languages retained. Language selection supports ?lang=de, ?lang=fr and ?lang=ja and works when storage is blocked. These are client-side translations, not separately rendered multilingual SEO pages.
- No wallet connection or seed-phrase collection. Wallet links open external websites only.
- All required visual assets are bundled. Existing images are no longer required by this rebuild.
- No analytics, tracking scripts, remote fonts or external image requests added.

## API configuration
The original browser-side API key and pool ID are retained in config.js, as requested. They are not printed in these notes. The key remains publicly visible. Live data still depends on API availability, quota and allowed origins. Do not mistake this static setup for a secured backend.

The page requests only:
GET /pools/{poolId}
GET /pools/{poolId}/history?order=desc&count=30

If origin/endpoint filters are enabled, allow the deployed site origin and these endpoints. A localhost preview or a different github.io origin may be rejected. This package does not change those account settings.

The included canonical, robots, sitemap and 404 home link target the existing https://ispool.live/ custom domain. Relative website assets were tested under a repository subpath too. If you permanently move to a different domain, update these metadata values and config.js siteUrl.

If you change poolId, regenerate pool-qr.png and update the visible IDs/explorer links in index.html as well. Do not change only one representation of the ID.

## Content changes
Removed unsupported absolute uptime, 'flawless' operation, renewable-energy percentage, fourth-pool ranking and speculative token-reward promotion. Retained owner-provided Swiss/Zurich location, since-2020 statement and hardware, clearly labelled as operator-reported. Verify those details before publication. The fixed pool cost is explained as a pool-level cost, not a separate invoice per delegator.

## Testing
See QA-RESULTS.md. Browser layout and interaction checks passed after fixes. Successful live API/populated-chart integration remains unverified from this environment. No synthetic data was used. The live website has not been modified.

## Reference documentation
GitHub Pages static hosting: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
Blockfrost API: https://docs.blockfrost.io/
Blockfrost access filters: https://blockfrost.dev/overview/settings/access-filters
