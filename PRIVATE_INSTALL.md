# Install Stockmarket TV privately

No app store is required. Install on your own and friends' Android TV / Google TV or **Fire OS** TVs using the interactive local-network installer. The supplied APK is version 1.3.0. Fire TVs running **Vega OS** cannot install this Android APK.

## What you need to install an existing APK

- A compatible TV, awake, on the same Wi-Fi or Ethernet LAN as the computer.
- **Node.js 22+** on the computer ([download](https://nodejs.org/en/download)).
- **Android SDK Platform-Tools** (`adb`) on the computer ([official downloads for Windows, macOS and Linux](https://developer.android.com/tools/releases/platform-tools)). Android Studio is not required. This project's local SDK is already detected on this computer.
- The built `app-debug.apk` (already present in this project) and the installer script. You do not need `npm install`, a local web server, or a TV player account.

## From git clone to installed on a TV

Use this route to build the current source on a new laptop. Generated APKs, bundled web assets and local toolchains are ignored by Git, so a fresh clone needs a build before installation. The `android/` source project and Gradle wrapper belong in Git.

### Install the build tools

Install Git, Node.js **22.18+**, **JDK 17**, and [Android Studio](https://developer.android.com/studio). In Android Studio's SDK Manager, install:

- Android SDK Platform 35
- Android SDK Build-Tools 35.0.0
- Android SDK Platform-Tools
- Android SDK Command-line Tools (latest)

Use the SDK location displayed in SDK Manager for `ANDROID_HOME`, and the installed JDK 17 directory for `JAVA_HOME`. Gradle downloads its pinned version automatically; no separate Gradle installation is required.

### Clone and configure

```sh
git clone https://github.com/SamFeltip/stockmarket-tv.git
cd stockmarket-tv
npm ci
cp .env.example .env.local
```

On Windows PowerShell, replace the last command with:

```powershell
Copy-Item .env.example .env.local
```

The example environment uses the existing live configuration:

```dotenv
VITE_CONVEX_URL=https://effervescent-flamingo-244.convex.cloud
VITE_PHONE_URL=https://stockmarket.samfelton.com
```

This configuration needs no local phone server or backend deployment. The TV and phones need internet access. If changing these values, both apps must use the same Convex backend, and the phone URL must be reachable from phones.

### Configure Java and the Android SDK

On Linux/macOS, adjust these paths to match your installations:

```sh
# Typical Linux SDK location:
export ANDROID_HOME="$HOME/Android/Sdk"

# On macOS, use this instead:
# export ANDROID_HOME="$HOME/Library/Android/sdk"

# Replace with your installed JDK 17 directory:
export JAVA_HOME="/path/to/jdk-17"

export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
```

On Windows PowerShell, adjust these paths instead:

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:JAVA_HOME = "C:\path\to\jdk-17"
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:Path"
```

These settings apply to the current terminal. Save them in your shell profile or Windows user environment settings to reuse them in future terminals.

Verify the tools and accept the SDK licences:

```sh
java -version
adb version
sdkmanager --licenses
```

Java should report version 17. In PowerShell, use `sdkmanager.bat --licenses` for the last command.

### Build the APK

From the `stockmarket-tv` project root on Linux/macOS:

```sh
npm run android:sync
cd android
./gradlew assembleDebug
cd ..
```

On Windows PowerShell:

```powershell
npm run android:sync
cd android
.\gradlew.bat assembleDebug
cd ..
```

The APK is generated at `android/app/build/outputs/apk/debug/app-debug.apk`. `android:sync` builds the web interface and copies it into the Android project's assets. Run it again and rebuild after changing the interface or `.env.local`; the URLs are embedded in the APK.

### Install and launch on the TV

Connect the laptop and TV to the same LAN, keep the TV awake, and enable its debugging access using the Fire TV or Android TV instructions below. Then, from the project root:

```sh
npm run tv:install
```

Select your TV and approve the debugging prompt on its screen. If Android wireless pairing is required, choose **P**, enter the pairing address and code, then select the TV's connection address. The connection port is usually different from the pairing port.

Alternatively, supply the TV address directly:

```sh
# Fire TV or network debugging on port 5555:
npm run tv:install -- 192.168.1.50

# Android wireless debugging: use the connection port shown on the TV:
npm run tv:install -- 192.168.1.50:37123
```

The installer installs the APK and opens Stockmarket TV. Repeat for each TV. After installation, the laptop can be switched off; each TV connects directly to the hosted backend.

### Install future updates

From the project root on Linux/macOS:

```sh
git pull
npm ci
npm run android:sync
cd android
./gradlew assembleDebug
cd ..
npm run tv:install
```

On Windows, use `.\gradlew.bat assembleDebug` instead of `./gradlew assembleDebug`.

Updates must use the same signing key as the installed APK. When moving build machines, preserve the original debug keystore (normally `~/.android/debug.keystore`, or `%USERPROFILE%\.android\debug.keystore` on Windows). A fresh laptop normally generates a different debug key, which cannot update an existing installation signed by the old key. For long-term distribution, use and securely back up a permanent release signing key. Uninstalling to resolve a signature mismatch erases recent games and the TV's lobby control tokens.

## Prepare a Fire TV

1. Open **Settings → My Fire TV** (sometimes **Device & Software**) **→ About**.
2. If Developer Options is hidden, highlight the device name and press Select seven times.
3. Go back to **Developer Options → ADB Debugging** and enable it.
4. Keep the TV screen visible so you can approve this computer's debugging prompt.

Official guide: [Connect to Fire TV through ADB](https://developer.amazon.com/docs/fire-tv/connecting-adb-to-device.html).

## Prepare an Android TV / Google TV

1. In **Settings → System / Device Preferences → About**, select **Android TV OS build / Build** seven times to enable developer options. The labels vary by TV manufacturer.
2. Open **Developer options** and enable **Wireless debugging** if available. Some TVs instead offer **Network debugging / ADB debugging** on port 5555. A USB-debugging toggle alone does not necessarily enable network access.
3. For wireless debugging, choose **Pair device with pairing code** and leave that screen open. The installer has a **P** option to pair using its IP address, pairing port and code. A TV advertising a pairing service also appears with **PAIR FIRST** in the device list.
4. After pairing, connect using the normal IP address and **debugging port** on the main Wireless debugging screen. This is usually different from the pairing port. The script discovers it automatically when mDNS works; otherwise choose **M** and enter it.

If the TV offers no network/wireless debugging, use its manufacturer-supported USB ADB connection first. Already-connected USB TVs appear in the script's selection list too. The installer cannot remotely enable developer options or bypass pairing.

Official reference: [Android ADB wireless connection and pairing](https://developer.android.com/tools/adb#connect-to-a-device-over-wi-fi).

## Scan, choose and install

From this project's folder:

```sh
cd /home/sam/Code/stockmarket/stockmarket-tv
npm run tv:install
```

Or run the script directly from any directory:

```sh
node /home/sam/Code/stockmarket/stockmarket-tv/scripts/install-tv.mjs
```

The installer:

1. Looks for connected ADB devices, wireless debugging services and local devices with TCP port 5555 open.
2. Lists available candidates; enter a number to choose your TV. Devices with an open port are candidates until their TV identity is checked. Phones may appear through ADB discovery; the script refuses to install on a device that does not identify as a TV.
3. Connects **only to your selection**. Approve the debugging prompt on the TV, then press Enter on the computer if requested.
4. Installs with `adb install -r`, preserving existing app data, then opens Stockmarket TV. It does not uninstall existing versions or change TV settings.

The menu also offers **R** to rescan, **M** for a manual IP/port, **P** to pair, and **Q** to quit. All ADB operations target the selected serial explicitly. Discovery only probes the ADB port on your local subnets; it does not pair with or install on discovered devices automatically.

Examples:

```sh
# Skip the scan when you know the address
npm run tv:install -- 192.168.1.50

# Android TV wireless debugging with its displayed connection port
npm run tv:install -- 192.168.1.50:37123

# Choose a particular LAN subnet
npm run tv:install -- --network 192.168.2.0/24

# Explicit APK or adb path (quote paths containing spaces)
node scripts/install-tv.mjs --adb "/path/to/platform-tools/adb" --apk "/path/to/app-debug.apk"

# Install without opening the app
npm run tv:install -- --no-launch
```

On Windows use `adb.exe`, for example `--adb "C:\platform-tools\adb.exe"`. Both the direct Node command and `npm run tv:install` work without Bash. `STOCKMARKET_ADB`, `ANDROID_HOME` and `ANDROID_SDK_ROOT` are also supported; standard Android SDK locations and this project's `.toolchain/sdk` are searched.

## If the TV does not appear

- Wake it up, enable network debugging and choose **R**. The script can only find devices exposing debugging services.
- Use **M** with the TV IP from its Network / About settings. Add the displayed debugging port for Android wireless debugging; Fire TV normally uses 5555.
- Guest Wi-Fi, client isolation, VPNs and host firewalls can block discovery or connections. Use a LAN where the computer and TV can reach each other.
- Automatic IPv4 scanning covers each physical interface's local /24 block (or its actual smaller subnet). On a larger LAN, specify `--network`; private IPv4 subnets /22 through /32 are accepted, with a maximum of 1024 addresses per scan. IPv6 is supported for direct connections and ADB service discovery, for example `[fe80::1234%en0]:37123`.
- If `adb mdns services` or `adb pair` is unavailable, update Android SDK Platform-Tools, or enter a connection address manually if pairing is unnecessary.
- An unauthorized device needs approval on the TV; an offline device may need debugging toggled off and on. The installer never bypasses authorization.
- If an update fails with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, obtain an APK signed with the same key as the installed version. The script intentionally does not uninstall the old app and erase its settings.

After installation, launch it from the TV's apps list. You can turn ADB debugging off again; the app only needs internet access. Phones scan the QR code and use `https://stockmarket.samfelton.com`, connected to the same live Convex backend.

## Share with friends

The portable ZIP is at `private-install/stockmarket-tv-v1.3.0.zip`. It contains `install-tv.mjs`, `app-debug.apk` and a short README. Extract all three into one folder. With Node.js and Platform-Tools installed, run:

```sh
node install-tv.mjs
```

The script automatically finds the APK alongside itself. No project checkout or npm dependencies are required. Each friend runs this on a computer connected to their own TV's LAN; your computer does not need to remain online.

The supplied debug APK is suitable for private testing. For long-term sharing, keep a permanent release signing key so updates install over earlier versions. Private sharing controls who receives the file; it does not prevent forwarding or impose a server-side device allowlist.
