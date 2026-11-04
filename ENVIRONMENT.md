# TV environment

TV configuration belongs in this repository. From here, run `npm ci`, then create the local configuration on a fresh checkout:

```sh
cp .env.example .env.local
```

In PowerShell, use `Copy-Item .env.example .env.local`. Preserve an existing file. The example contains public production URLs; edit both before using a development backend.

| Variable | Source | Purpose |
| --- | --- | --- |
| `VITE_CONVEX_URL` | `.env.local` | The same Convex backend used by the phone web app. |
| `VITE_PHONE_URL` | `.env.local` | Phone frontend destination for QR links, not the TV frontend. |

For the hosted game, the matching pair is:

```dotenv
VITE_CONVEX_URL=https://effervescent-flamingo-244.convex.cloud
VITE_PHONE_URL=https://stockmarket.samfelton.com
```

For development, use the web project's development Convex URL and its phone frontend URL. A physical phone needs a reachable LAN or hosted URL; `localhost` refers to the phone itself when scanned. The TV browser development server runs on port 5174; the phone web server normally uses 5173.

`npm run dev`, `npm run build` and the Android build helpers load this repository's configuration. From the parent, use `npm run <script> --prefix stockmarket-tv`; npm sets this repository as the script working directory. Vite loads `.env`, `.env.local`, `.env.[mode]` and `.env.[mode].local` here; mode-specific files override generic files, and the invoking process's existing variables take priority. `.env.example` is not loaded automatically. No parent or sibling env file is read, and no shell `source` command is needed.

URLs are embedded in the browser/APK assets. Restart the dev server after changes, and rebuild an APK with `npm run android:debug` or the release workflow after changing configuration. `npm run android:sync` refreshes bundled assets but does not assemble an APK. All `VITE_*` values are public: never put credentials there. The Android verification workflow supplies the same public production URL pair in its job environment, so CI needs no private env file. Vite supplies `BASE_URL` from its configuration.

## Android tooling and signing

These are **process environment variables** consumed by Node, Gradle or Android tools. Vite `.env.local` does not export them to those tools. Set them in your terminal/IDE or CI environment, for example:

```sh
export JAVA_HOME="/path/to/jdk-17"
export ANDROID_HOME="/path/to/android-sdk"
npm run android:debug
```

PowerShell uses `$env:JAVA_HOME = 'C:\path\to\jdk-17'` and `$env:ANDROID_HOME = 'C:\path\to\android-sdk'`. Android's ignored `android/local.properties` can alternatively supply `sdk.dir`.

| Variable | When used |
| --- | --- |
| `JAVA_HOME` | Selects the JDK; otherwise tools use Java from `PATH`. |
| `ANDROID_HOME` / `ANDROID_SDK_ROOT` | Android SDK and ADB discovery; prefer `ANDROID_HOME`. |
| `GRADLE_USER_HOME` | Optional Gradle cache location. |
| `STOCKMARKET_ADB` | Optional explicit ADB executable for `tv:install`; its command-line option also supports this. |
| `STOCKMARKET_WEB_SOURCE` | Optional source URL override for `scripts/sync-presentation.mjs`; defaults to the sibling web checkout. |
| `STOCKMARKET_SHARP_PATH` | Optional module path override for the store-artwork script. |

The release helper reads ignored `.release/signing.json` and `.release/stockmarket-tv.jks`, then supplies `STOCKMARKET_KEYSTORE`, `STOCKMARKET_STORE_PASSWORD`, `STOCKMARKET_KEY_ALIAS` and `STOCKMARKET_KEY_PASSWORD` to Gradle. Its key-generation subprocess uses `RELEASE_KEY_PASSWORD` internally. Do not put signing values in Vite files or commit them. Restore the existing signing material for store updates; see [PUBLISHING.md](PUBLISHING.md). Direct Gradle release invocations must supply those four signing variables themselves.

Environment files, local SDK paths and signing material are ignored. Only the public `.env.example` template is committed.
