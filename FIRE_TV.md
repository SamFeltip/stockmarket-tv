# Sideload on an Amazon Fire TV Stick

This is the same Android development APK used on Android TV. No Appstore submission, Amazon developer account or release signing setup is needed for this Fire OS ADB workflow.

## Check the Stick first

Check **Settings → My Fire TV → About** for the model and OS. This project targets Android API 23+ and uses a modern system WebView. Fire OS 6+ devices are candidates; test your particular model before relying on it. Fire OS 5 devices are below the minimum Android version. **Vega OS devices cannot run this APK** and need a separate Vega app. Amazon distinguishes APKs for Fire OS from VPKG packages for Vega in its [package requirements](https://developer.amazon.com/docs/app-submission/submitting-apps-to-amazon-appstore.html).

## Build from a fresh clone

Install Node.js 22.18+, JDK 17, and Android Studio's SDK tools: Platform 35, Build-Tools 35.0.0, Platform-Tools and Command-line Tools. Configure `JAVA_HOME`, `ANDROID_HOME`, and accept SDK licences as described in [PRIVATE_INSTALL.md](PRIVATE_INSTALL.md#configure-java-and-the-android-sdk).

```sh
git clone https://github.com/SamFeltip/stockmarket-tv.git
cd stockmarket-tv
npm ci
cp .env.example .env.local
npm run android:debug
```

In Windows PowerShell use `Copy-Item .env.example .env.local` instead of `cp`. Both npm commands work on Windows, Linux and macOS; the build helper selects the appropriate Gradle wrapper.

Check `.env.local` before building. The example points to the hosted phone app and its matching Convex backend. The Stick needs internet access; the phone frontend and backend do not run on your laptop. No sibling website checkout is required to build this repository.

`android:debug` rebuilds the web interface, copies it into Android assets, builds the debug APK and runs Android lint. The output is:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

The script prints the APK's SHA-256. Generated assets, APKs, SDKs and signing keys stay outside Git; the source, Gradle wrapper, instructions and installer are tracked.

## Enable debugging and install

1. On the Stick open **Settings → My Fire TV → About**. If Developer Options is hidden, highlight its device name and press Select seven times.
2. Return to **My Fire TV → Developer Options** and enable **ADB Debugging**.
3. Find the Stick's IP address under **About → Network**. Connect the laptop and Stick to the same LAN and keep the TV screen awake.
4. From the project root run:

   ```sh
   npm run tv:install -- 192.168.1.50
   ```

   Replace the example IP with your Stick's address. Fire OS network ADB normally uses port 5555. Approve the computer on the TV when prompted; press Enter on the laptop if the installer asks.

The installer checks that the selected device identifies as a TV, installs with `adb install -r` and opens `com.stockmarket.tv/.MainActivity`. Run `npm run tv:install` without an IP to scan and select instead. You can disable ADB after installation and switch off the laptop; the app remains installed and connects directly to the hosted backend.

See Amazon's [Fire TV ADB instructions](https://developer.amazon.com/docs/fire-tv/connecting-adb-to-device.html) if the menus differ. If discovery fails, use the direct IP and check guest Wi-Fi isolation, VPNs and firewall settings. A Vega device will not appear as a compatible Android ADB TV.

## Verify with the Fire remote

Use D-pad and Select for every on-screen control, including reveal skip/next buttons; a coloured remote button is unnecessary. Check that you can:

- Open the app from the installed apps list and create a lobby or enter a code.
- Scan the QR on a phone, join the same lobby and see players update on the TV.
- Start with four players, navigate the board/feed and progress through reveals and period summaries. Hold-stock choices happen on phones.
- Use Back to return, Home to leave, and reopen the app with recent games and TV controls preserved.
- Recover after losing and restoring internet access, with readable text and visible focus at the Stick's display resolution.

This workflow has automated installer tests and local Android build checks. Those checks do not replace testing the actual Stick's WebView, remote, launcher and screen margins.

## Update without losing the TV's game controls

```sh
git pull
npm ci
npm run android:debug
npm run tv:install -- 192.168.1.50
```

Use the **same debug signing key** for updates. Moving laptops requires securely transferring the original `~/.android/debug.keystore` (`%USERPROFILE%\.android\debug.keystore` on Windows). Do not commit it. A different key causes `INSTALL_FAILED_UPDATE_INCOMPATIBLE`; use the original key rather than uninstalling, which would erase the TV's control tokens and recent games. The installer never uninstalls automatically.

For an existing APK, no npm dependencies or Android Studio are needed: use Node.js and Platform-Tools with `node scripts/install-tv.mjs --apk /path/to/app-debug.apk 192.168.1.50`. For portable sharing and additional troubleshooting, see [PRIVATE_INSTALL.md](PRIVATE_INSTALL.md).
