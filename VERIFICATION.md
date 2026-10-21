# Verification — 20 October 2026

Story: create a TV lobby with the remote → persist it in the existing Convex backend → join on phones → launch from the TV → show live public market and portfolio updates without a player identity.

## Live development service and browser

Verified against the existing `hushed-lyrebird-117` development deployment. These initial gameplay checks used development only. Production was subsequently updated after the user explicitly approved deployment.

- D-pad Right + OK selected seven periods on the TV home screen.
- D-pad Down + OK created a real TV lobby with zero player seats, a lobby code and QR.
- Four synthetic development phone players joined using the existing authentication and game-joining APIs; all four appeared live on the TV and enabled the start button.
- D-pad Up + OK launched the game from the TV capability.
- A development phone player bought 1,000 Trusthouse Forte shares. Without refreshing the TV, holdings became 1k, cash became £58,000, total wealth remained £60,000, the current turn advanced, and the purchase appeared in the latest-purchase and activity panels.
- Opening the phone destination without a session showed login. Switching to sign-up and back preserved the lobby in `next`. Signing in as the synthetic player returned to `/games/show/<code>` and rejoined the correct game.
- The six-stock, six-portfolio demo was visually checked at a 1280×720 browser viewport; the dashboard and footer fit on one screen.

After live-service verification, `.env.local` and the final debug APK were rebuilt with `https://stockmarket.samfelton.com` and `https://effervescent-flamingo-244.convex.cloud`. The production frontend’s public client bundle confirms this exact backend (another URL in the bundle is only an SDK error-message example). The production Convex deployment completed successfully after user approval; schema validation passed and no indexes were deleted. A live TV lobby was created successfully with zero player seats and six stocks. The phone frontend was deployed to the confirmed `stockmarket-convex` Pages project, which serves `stockmarket.samfelton.com`. Cloudflare deployment: `https://0689b346.stockmarket-convex.pages.dev`. The custom-domain game link and sign-up/login switches were verified live afterward and preserve the target lobby. No local phone server is needed with the live configuration.

## Automated checks

- Backend lint: passed.
- Backend tests: 119 passed across two runs (93 regular tests; 26 complete-game/NPC simulations).
- The first simulation run exceeded Vitest’s default five-second timeout; a combined rerun was terminated. The isolated simulation file passed all 26 tests with a 30-second timeout. No test logic was changed.
- Phone frontend TypeScript and production build: passed.
- TV unit tests: 2 passed. TV TypeScript and production build: passed.
- Android `assembleDebug lintDebug`: passed. Lint reported 0 errors and 3 warnings (TV landscape orientation, Android 12 backup configuration guidance, and bitmap density variants).
- Debug APK signature: verified. Bundled assets match the final `dist/` byte for byte and contain the intended live URLs.
- The dashboard screenshot’s QR decoded successfully to the expected phone game route. A production lobby screenshot is saved at `docs/live-lobby.jpg`.
- Phone asset validation: all 27 referenced assets passed.
- The original checkout was missing ten ignored phone images/font assets. They were restored byte for byte from the existing live phone site before preparing any frontend deployment; no replacement artwork or fonts were invented.

## Device limits

Browser checks validate the UI and real Convex integration, not a physical TV. Validate sideloading, launcher display, manufacturer-specific remote behavior, scanning distance and WebView compatibility on the intended Android TV and Fire OS devices. Android APKs do not run on Vega OS Fire TV models.

## Website-theme revision 1.1

The TV's earlier visual design was replaced with the website's original styles, typography and image assets. Home, lobby and game screens were visually checked at 1280×720. All six portfolios fit without page overflow, player names remain visible, all images load, fonts are loaded, and the browser console has no warnings or errors. D-pad navigation between Back and Launch Game was verified. Screenshots: `docs/lobby-v1.1.jpg` and `docs/game-v1.1.jpg`.

The public spectator API now includes the existing public player portrait paths and stock image paths. Its four integration tests passed, including privacy checks across every phase; the two TV remote/QR tests passed. The public image-path addition was deployed to the existing production backend and smoke-checked.


## TV presentation revision 1.2

Feed moved into the right sidebar, with the original website trade message component, public portraits and logos. QR moved to the bottom-left, followed by combined wealth and latest purchase. Change arrows remain the price change since the game started, as requested.

The TV now queues new buy/sell/pass events into the website-style central portrait/action overlay (3.5 seconds), with no historical-feed replay on opening a game. End-of-round presentation uses the original website reveal, chart, wealth, overview and settlement/preview components. Insights animate every 2.5 seconds and the remote advances stocks/summary; player hold choices and host settlement remain on phones. A closing snapshot is retained if the host moves ahead; actual settled public prices reconcile missed hold updates.

Public API privacy: `reveal` is null during waiting, playing and finished; it contains allowlisted public cards only during closed/special_insights, matching the website. Five Convex integration tests passed, including a complete real twelve-turn close, reveal, host advance, and confirmation that next-period cards are hidden. TV presentation/remote tests cover animation queue ordering, system-event filtering, reveal gating, settlement, and hold reconciliation. Production dependencies: zero npm audit advisories.

Chrome viewport checks confirmed all stocks, six players and controls inside 1920×1080 and 3840×2160 for game, reveal and summary; no page overflow. Root scale doubles from 20.844px to 41.688px. Also visually checked at the TV-style 1280×720 logical viewport; all images load and no reveal console warnings/errors. Physical 4K hardware is not available here: device OS compositor resolution remains device-controlled, and some 4K TVs upscale 1080p app interfaces. Screenshots are under `docs/*v1.2.jpg`.

Final validation: six TV tests and five backend integration tests passed, backend lint/type checking passed, and the production Convex deployment completed without deleted indexes. Live read-only smoke check confirmed the existing lobby has `reveal: null`, six stocks and public feed image fields. The complete remote reveal/skip/next sequence reaches the six-stock round overview. Android `assembleDebug lintDebug` succeeded (existing lint warnings remain). Version 1.2.0 / code 3: all 40 bundled web files match final dist byte-for-byte, and APK signature verified. SHA-256: `9e0033317d60e6bc240b94fe0891077da88b72e41b4cb2f5551b6221e7a67c6c`.


## Private network installer

Dependency-free Node installer discovers connected ADB devices and mDNS wireless services, and probes TCP 5555 on bounded local/private IPv4 subnets. It supports selection, pairing, manual addresses, authorization, TV identity checks, data-preserving install and optional launch. Only the selected device is queried/installed. Eight installer tests passed. A portable ZIP was extracted and exercised end-to-end against an isolated fake ADB, verifying adjacent APK discovery, correct device serial, `install -r`, launch, and no uninstall. No physical TV installation was attempted during these checks.


## Period control and game-over revision 1.3

The creating TV token now authorizes `tv:next`, with common settlement logic extracted to `convex/advancePeriod.ts`. Phone `rounds:next` rejects TV-controlled games; phone-created games retain host controls. The controller can advance periods and finish the final period, with stale-period, wrong-token and pending-hold checks. No new schema migration or private fields are needed.

AI jobs wait 4.3–5.3 seconds before deciding, allowing the previous 3.5-second action animation to complete. Both clients share timing constants; closing insight reveals wait until the final action plus a 500ms pause. The web now displays the same portrait/action animation across phase changes. New periods immediately replace all prior reveal screens; the TV no longer retains closing snapshots. RoundWealth displays holdings in the currently revealed tradable stock underneath each net worth.

TV game-over uses the original GameResults, FinalHoldings, StockHistoryStrip and marquee components, with a TV navigation adapter and desktop layout at all TV viewport widths. Browser checks at 1280×720 confirmed all six portfolios fit, D-pad selection changes the active portfolio, and a demo period change interrupts unfinished reveals with no Continue button. Screenshots: docs/game-over-v1.3.jpg and docs/holdings-reveal-v1.3.jpg. The IAB ignored the requested 4K viewport override, which was reset; this revision's visual browser check is 1280×720. Existing proportional scaling remains in place.

Targeted backend/phone tests: 14 passed, including a complete six-period TV-controlled game and the NPC timing floor. TV tests: 7 passed. Installer tests: 8 passed. Both frontend TypeScript/build checks passed; modified backend/phone source lint passed.


Release validation: an additional 35 existing settlement/results/full-game tests passed, including all mixed human/AI whole-game simulations. Android assembleDebug/lintDebug passed with existing warnings. All 40 bundled web files match dist; signature matches the installed 1.2 key. APK version 1.3.0 / code 4 SHA-256: `792d88ee321a8cb1fdf00f29469a602094e68bea81249d7559a7de1311ab1c5f`. The private installer ZIP was refreshed to 1.3.0.

Production: Convex deployed with schema validation and no deleted indexes. Phone Pages deployment: https://65fb8bf0.stockmarket-convex.pages.dev; stockmarket.samfelton.com returned 200 with the new production bundle. The public TV query reports tvControlled=true for the known TV lobby, with reveal=null while waiting; tv:next rejects a wrong token with `Only the controlling TV can advance the round` (Convex error data). The installer updated the physical Smart TV Pro at 192.168.1.235, preserving data. Device package verification confirms versionName=1.3.0 / versionCode=4, and MainActivity is the foreground activity. Its WebView version is 153.0.8010.36.
