# Stockmarket TV

A separate Android TV / Google TV and Amazon Fire TV **Fire OS** project using the existing `stockmarket.js` Convex backend. The TV owns no player seat and receives no private insight cards while trading is open. After the market closes, it receives the same public reveal as the phone app.

The interface is bundled into a small Android WebView application, served from a local HTTPS asset origin. Convex subscriptions supply live game data; no TV web hosting or Google Play Services is required. The interface can also run in a browser for development.

## Website theme (version 1.1)

The TV uses the website's original Bootstrap stylesheet and `styles.css`, Big Caslon title font, Inter body font, company logos, movement icons, player portraits, and app icon. These assets are vendored under `public/static/`, so the app remains standalone and loads its visuals from the APK. `npm run theme:sync` refreshes the original assets from the sibling website project; preserve the separately bundled Inter regular font and OFL license.

The lobby follows the website's centred yellow lobby code, portrait roster, game length, and Back / Launch Game controls, with a phone-joining QR panel. The game view adapts the website's green header cards and white content panels to show all stocks and portfolios simultaneously. Remote focus rings and TV-safe sizing are the main presentation changes.

Use `?demo=1&view=lobby` to preview a populated lobby and `?demo=1` to preview the six-player game. These are labelled previews and do not create games.

## Display layout and resolution (version 1.2)

The game feed occupies the right sidebar and scrolls using Up/Down when focused; move down past its end to reach Back. The bottom row contains the QR code, combined wealth (winner after completion), and latest purchase. Stock arrows show price movement since the start of the game. The full-screen play animation uses the player's portrait, name, stock logo and action, with the website's 3.5-second fade. New buys, sells and passes are queued chronologically; opening an existing game does not replay its old feed.

When trading closes, the TV uses vendored copies of the website's `RoundReveal`, `RoundOverview`, `RoundWealth`, `StockPriceChart`, `FeedMessage`, and settlement/preview logic. Insights reveal every 2.5 seconds; use the remote's yellow button to skip to the stock result, advance stocks and view the summary. Hold decisions remain on the owner's phone. The TV cannot settle a period. A public closing snapshot stays visible if the phone host advances while the TV is reviewing it, with a Continue to game button after the overview. Use `?demo=1&view=play`, `?demo=1&view=reveal` or `?demo=1&view=summary` to preview these views. `node scripts/sync-presentation.mjs` refreshes the copied website components; TV adapters stay separate.

The layout scales proportionally at 1920×1080 and 3840×2160, with vector charts, QR codes, and text rendering at the WebView’s available pixel density. The same layout also fits the smaller logical viewport used by high-density TV devices. Physical UI output resolution is controlled by the device OS: some 4K TVs render app interfaces at 1080p and upscale them ([Android documentation](https://developer.android.com/reference/android/view/Display.Mode#getPhysicalWidth())). No display-mode or refresh-rate change is forced.

## What it does

- Create a lobby using only the remote: choose 6–10 periods, press Create, and receive a random lobby code and QR code.
- Scan the TV QR code with a phone to open the existing phone app. Sign-in and sign-up preserve the destination game.
- The first phone to join becomes the host. The TV never takes a seat, has cash, or receives cards.
- Start from the creating TV when at least four players have joined, or use the phone host's controls. The existing backend supports four to six players.
- Show all six market prices and all player portfolios simultaneously: cash, shares in each company, total wealth, ranking, current investor and period.
- Show recorded price trends, price changes since the start of the game, shares held, aggregate wealth, money invested, the latest purchase and recent public trades.
- Show final standings and revisit past games using their codes or the twelve recent games saved on this TV. Historical charts use recorded prices; missing history is never fabricated.
- D-pad directional focus, OK/Enter activation, an on-screen lobby-code keyboard, Back navigation, visible focus rings, reconnect feedback and overscan margins. Home on the TV leaves the game running.

## Backend changes

Deploy the accompanying changes in `../stockmarket.js` to the **same** Convex deployment that the phone frontend uses:

- `convex/tv.ts`: unauthenticated public `board` query, seat-free `create` mutation, and capability-protected lobby `start` mutation.
- `convex/launch.ts`: shared launch validation/dealing used by both phone and TV.
- `convex/schema.ts`: optional `tvTokenHash`, and optional `hostId` while a TV lobby has no human host.
- `convex/games.ts`: first human joining a TV lobby becomes host.
- `src/AuthPage.tsx` / `shared/auth-destination.ts`: retain a scanned game route through sign-in or sign-up; allow only local game destinations.

The TV generates a cryptographically random 256-bit control token, stores it locally before creation, and sends it only to mutations. Convex stores its SHA-256 hash. The code and QR never contain this capability. `tv:board` explicitly selects public fields and never reads `playerInsights` while trading is open, and never reads authentication records, NPC traces or memory. Anyone who knows a lobby code can spectate; it is a public game display, not an account dashboard. The creating TV can launch its lobby but cannot trade, inspect cards, settle a period or control another TV's game. Phone-host controls continue to work normally.

Creation retries with the same code and token are idempotent. Clearing TV app data loses the TV's launch capability and recent games; the phone host retains control. Empty abandoned TV lobbies remain in Convex, as do normal persistent games. Creation is a guest endpoint; add deployment-level abuse controls before distributing publicly if needed.

## Browser development

Node 22.18+:

```sh
npm ci
cp .env.example .env.local
# Edit both URLs before continuing.
npm run dev
```

Set:

```dotenv
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_PHONE_URL=https://your-phone-frontend.example.com
```

The live phone app is `https://stockmarket.samfelton.com` and its client uses `https://effervescent-flamingo-244.convex.cloud`. The example environment contains this exact pair. The TV endpoints and phone sign-in redirect fix were deployed to that existing live configuration on 20 October 2026. Existing phone-created games can be watched by entering their code; no TV-specific game creation is required.

Use the same backend for both apps. The phone URL must point to the **phone frontend**, not the TV app, and must be reachable from phones. The default preview is at port 5174; `?demo=1` shows a clearly labelled offline sample dashboard without creating a game.

For local LAN testing, run `npm run dev:frontend` in `../stockmarket.js` and set `VITE_PHONE_URL` to this computer's LAN address and port 5173, e.g. `http://192.168.1.238:5173`. Keep both devices on that LAN. A QR containing `localhost` points to the phone itself and will not work on another device. Use HTTPS for a deployed phone frontend.

For a development backend update, run `npx convex dev --once` in `../stockmarket.js`. For production, use that project's documented deployment workflow so the phone frontend and backend update together. This project does not publish either app automatically.

## Build and install on a TV

Install Android Studio (with JDK 17 and Android SDK Platform 35 / Build Tools 35), accept the Android SDK license, and configure `ANDROID_HOME` or `android/local.properties` with your SDK path.

```sh
npm ci
# Configure .env.local for the intended backend and phone frontend first.
npm run android:sync
cd android
./gradlew assembleDebug
adb connect YOUR_TV_IP:5555
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

`android:sync` builds the interface and copies `dist/` into Android assets. Run it after interface **or environment** changes. The Android build fails clearly if those assets are missing. On Fire TV, enable ADB debugging in Developer Options and approve the computer. Debug builds can be sideloaded; distribution requires your own release signing key. No signing key is committed.

Run `npm run tv:install` to discover available debugging devices on your LAN, select a TV, install the existing APK and open it. It works on Linux, macOS and Windows with Node.js 22+ and Android SDK Platform-Tools. This computer's project-local ADB is detected automatically. For direct connection use `npm run tv:install -- YOUR_TV_IP`; wireless Android debugging with a custom port and pairing is supported. See [PRIVATE_INSTALL.md](PRIVATE_INSTALL.md) for TV setup, pairing, network options and a portable private-sharing bundle.

You can also open `android/` directly in Android Studio and use Build APK. Both `LAUNCHER` and `LEANBACK_LAUNCHER`, a TV banner, landscape orientation and optional touch/leanback features are provided. The app keeps the display awake while visible and blocks navigation away from its bundled HTTPS origin.

Targets Android 6 / API 23+ with a current WebView, including Android TV / Google TV and Android-based Fire OS devices (Fire OS 6+). Fire TV devices running **Vega OS** cannot install Android APKs and need a separate Vega application. Apple TV is outside this project.

Platform references: [Android TV manifest requirements](https://developer.android.com/training/tv/get-started/create), [Fire TV Android differences](https://developer.amazon.com/docs/fire-tv/differences-from-android-tv-development.html), [Amazon hybrid WebView applications](https://developer.amazon.com/docs/fire-tv/build-and-test-your-hybrid-app.html), [Fire OS and Vega package formats](https://developer.amazon.com/docs/app-submission/submitting-apps-to-amazon-appstore.html).

## Verification

```sh
npm test
npm run build
# In ../stockmarket.js:
npm run check
```

TV tests cover directional navigation, screen edges and QR destination construction. Backend integration tests cover seat-free and idempotent creation, host assignment, launch validation, invalid capabilities, public trade/holding updates, missing games, and insight/capability privacy in all game phases. Authentication tests cover scanned-game redirects and reject unsafe destinations. The existing backend suite verifies gameplay and NPC behavior through the shared launch path.

Physical TV testing is still needed for manufacturer-specific remote keys, WebView versions, launcher appearance, overscan and scanning distance. The QR code is rendered locally; no external QR service receives game URLs.
