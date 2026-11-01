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


## Layout and trade fixes — 22 October 2026 / version 1.3.1

TV gameplay, reveal, summary, lobby and game-over previews fit 1920×1080, 3840×2160 and 1280×720 with no page overflow. Summary players and navigation occupy separate rows; animated wealth changes have their own reserved line. D-pad selection and visible focus borders were checked on period and final-player selectors. Public TV stock lists now use the corrected catalog volatility order, matching every phone list.

Phone checks at 375px, 390px and desktop verify the centred animated portfolio toggle, responsive Pass placement, Cancel and a single confirmed pass mutation using a local fixture. The final modal contains only its title and two footer buttons; mobile Buy, Sell and Pass all measure 44px high. Trades and legal actions now permit every 1,000-share increment within funds and holdings.

Validation: 125 web/backend tests, 7 TV tests and 8 installer tests passed; web lint, both production builds, asset validation, Android assembleDebug and lintDebug passed. APK version 1.3.1 / code 5; bundled assets match dist byte for byte. The portable installer is refreshed as private-install/stockmarket-tv-v1.3.1.zip.

Production Convex deployed successfully with schema validation and no deleted indexes. Cloudflare deployment https://a1189736.stockmarket-convex.pages.dev and https://stockmarket.samfelton.com both returned 200 with the new build and confirmed production backend URL. Physical TV update was unavailable: no ADB devices were attached and the previously used 192.168.1.235:5555 returned No route to host.

## Fire Stick development sideload workflow — 31 October 2026

Added `npm run android:debug` to build the interface, sync Android assets, assemble the development APK and run Android lint through the tracked Gradle wrapper. Added `FIRE_TV.md` for fresh-clone setup, Fire OS ADB installation, remote checks and updates preserving app data. Corrected README remote instructions and removed assumptions that ignored APK/ZIP outputs exist in a clone. Appstore publishing is outside this workflow.

Validation on Linux: 8 TV tests and 9 installer tests passed, including Fire TV recognition through `amazon.hardware.fire_tv` when no TV/leanback characteristic is reported. The new build command completed TypeScript/Vite, `assembleDebug` and `lintDebug`; APK signature verification passed, and all packaged web files match dist byte-for-byte. Windows/macOS command paths are implemented but were not executed here. No physical Fire Stick installation or remote/WebView validation was performed.

## Store release preparation — 1 November 2026 / version 1.4.0

Prepared release-signed APK and Android App Bundle for `com.stockmarket.tv`, version code 6. Added production signing/build helpers, a labelled launcher banner, game classification, listing copy, store icon/feature artwork, reviewer instructions and a data-disclosure inventory. Signing keys and credentials are stored only in ignored `.release/`; they must be securely backed up for future updates.

Added Privacy & support and Preview game to the TV home screen. The bundled policy uses the approved public support address, describes the companion-phone account flow and offers a manual account/data-deletion request route. The same HTML page is prepared in the phone frontend at `/tv-privacy.html`, with a prominent `#deletion` section and an email link; it is not yet published. No existing phone/gameplay screen was changed. Back from the TV home screen now exits directly; the app follows OS ambient/idle behavior instead of holding a permanent wake flag. Replaced unsupported `toSorted` calls in the copied results/summary logic with sorting of a copy; the source-copy helper preserves that compatibility adjustment.

Validation: 9 TV tests and 9 installer tests passed, including a regression test that makes `toSorted` unavailable while rendering results and a round summary. The phone/backend suite passed all 131 tests, lint, TypeScript/build and validation of 27 assets. A separate production frontend build explicitly used `https://effervescent-flamingo-244.convex.cloud`; it was not uploaded. Installing the phone dependencies required adding its already-declared QR package to the local, deliberately ignored lockfile/node_modules; no dependency declaration changed.

Android `assembleRelease bundleRelease lintRelease` passed with 0 errors and 6 warnings (category ignored below API 26, fixed TV landscape orientation, Android 12 backup configuration guidance and icon density/shape guidance). APK v1/v2 signatures and AAB JAR signature verified using a new 4096-bit RSA release key; the AAB verifier also emits self-signed-certificate/ZIP ordering warnings. The APK has no native `.so` libraries or ABI restriction. All 41 packaged web assets match final `dist/` byte-for-byte and include the deletion-request policy. Certificate SHA-256: `a508ec63b8f1223aa04e196d6c4461e5f10680b9cd17a82624b0db7cf4f67fea`.

Final APK SHA-256: `889e54addc39f9fc8afec7fa29787b8e26167634a018df5244903aa738a1fd82`.
Final AAB SHA-256: `6f3a8b1598e3473af9ad0bd0e9a86d662b9e22430220a4ed68199e69da5e5ac2`.

Browser verification at 1920×1080 confirmed the home and policy fit without page overflow, the policy scrolls with Down, and Escape returns home. The live home screen connected successfully to the production backend. Unaltered UI captures are in `store/previews/`; these are browser QA images, not physical-device screenshots. No TV was attached to ADB. Physical release testing, current Fire TV screenshots and reviewer phone credentials remain outstanding.

Publishing status: Google Play showed developer-account registration for the signed-in account; Amazon Developer required sign-in. No app listing or release was submitted. Automatic approval review rejected the repository's production backend deployment and then rejected the full frontend upload as broader production changes than the app-store request. The backend was left unchanged; explicit approval for the prepared frontend/privacy-page publication was requested and is pending. No store agreements, payments or identity-verification declarations were accepted on the user's behalf.

## Website publication — 1 November 2026

After explicit user approval, published the prepared frontend (no backend deployment) to the existing Cloudflare Pages project. Deployment: https://787be033.stockmarket-convex.pages.dev. Wrangler uploaded one new file; 39 were already present. Chrome confirmed that https://stockmarket.samfelton.com/tv-privacy.html redirects to the public canonical /tv-privacy page, displays the policy and deletion section, and offers the correct mailto deletion-request link. The main site rendered the authenticated home screen with Join, Spectate and Start game, with no browser console errors. A command-line HTTP probe received 403; browser verification succeeded. The browser policy viewport reported 677 CSS pixels despite a requested mobile override, so this was not represented as a 390px responsive test. The unaltered live browser screenshot is store/previews/privacy-web-live.jpg.

Google Play still requires developer-account registration and Amazon Developer still requires sign-in. Neither app store has received a submission; physical release testing and device screenshots remain outstanding. The previous approval block on the frontend upload was resolved by the user's explicit approval. Backend behavior was not changed.
