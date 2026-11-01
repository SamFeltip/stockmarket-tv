# Publishing Stockmarket TV

## Release artifacts

Package: `com.stockmarket.tv`, version `1.4.0`, version code `6`, minimum API 23, target API 35. This release supports Android TV / Google TV and Android-based Fire OS. Vega OS requires a separate VPKG application and is not covered by these binaries.

The Android application contains Java and bundled web assets, with no native `.so` libraries. It does not restrict CPU ABIs; the OS-provided WebView supplies its native runtime. No Google Play Services are required.

`npm run android:release` builds the production UI, signed APK, signed AAB and Android release lint report, then verifies signatures and writes:

- `.release/1.4.0/stockmarket-tv-1.4.0-google-play.aab` — Google Play upload.
- `.release/1.4.0/stockmarket-tv-1.4.0-amazon.apk` — Amazon Fire OS upload.
- `.release/1.4.0/SHA256SUMS` — artifact checksums.

Signing material is in ignored `.release/stockmarket-tv.jks` and `.release/signing.json`. **Back up both files securely together.** They are necessary for subsequent Amazon updates and for upload-key continuity. Do not commit them or upload them as store assets. Keep generated binaries outside Git too. Never replace an existing production signing key with a debug key. Existing privately sideloaded debug builds have a different certificate and cannot be updated in place with this release; do not uninstall them without considering loss of local TV game controls.

For a fresh project only, create signing material once:

```sh
npm ci
npm run android:signing:init
npm run android:release
```

Requires JDK 17 (`JAVA_HOME`), Android SDK 35 (`ANDROID_HOME`, including Build Tools 35.0.0), configured production `.env.local`, and accepted Android SDK licenses. The build rejects non-production phone/backend URLs and missing signing material. On this workstation, the existing SDK and JDK are under `.toolchain/`; set `GRADLE_USER_HOME` to `.toolchain/gradle-user` to reuse its cached dependencies.

## Store materials

- `store/listing.json`: title, description, short description, features, support email, policy URL and release notes.
- `store/assets/`: Google 512px icon and 1024×500 feature graphic; Amazon 114px/512px icons and 1280×720 TV artwork; editable SVG source.
- `store/REVIEW_NOTES.md`: reviewer flow, phone requirements and remaining screenshot/device checks.
- `store/DATA_DISCLOSURES.md`: data inventory and unresolved questionnaire details.
- `src/privacy.json`: policy source shared by the TV screen and public HTML page.

`node scripts/export-privacy.mjs --phone` refreshes the HTML policy in both sibling projects. The phone frontend hosts it at `/tv-privacy.html`. Deploy the phone project through its documented production workflow and verify the public URL. The TV build always exports its bundled copy.

To regenerate artwork, make the `sharp` npm package available and run `node scripts/store-artwork.mjs`; `STOCKMARKET_SHARP_PATH` can point to a preinstalled Sharp package. Artwork does not replace screenshots: capture the actual release on devices. Historical development screenshots in `docs/` should not be represented as freshly tested release screenshots.

## Google Play

1. Complete developer-account registration, identity/contact verification and any registration payment in Play Console.
2. Create **Stockmarket TV**, default language English (UK), game, free; use the production package ID above. Enable Play App Signing when prompted and retain a secure record of the chosen signing arrangement.
3. Add the store materials, screenshots, policy URL, deletion-request URL, app-access instructions, Data safety, target audience and content-rating answers. Select Android TV distribution. Disclose the linked phone-account flow and manual email deletion pathway.
4. Upload the AAB to internal testing and test the Play-delivered build on Android TV, including launcher artwork and remote navigation.
5. If required for the developer account, complete the closed-test gate before requesting production access. New personal accounts currently require at least 12 testers opted in continuously for 14 days; confirm the console's requirement for this account.
6. Submit for TV quality review and production only after the remaining checks pass.

## Amazon Appstore

1. Sign in, finish developer registration and identity verification if required, then add an Android app named **Stockmarket TV**.
2. Upload the signed APK. Select supported Fire TV **Fire OS** devices and deselect phones/tablets if offered. Do not select Vega-only models.
3. Enter listing text, icon/TV artwork, at least three current Fire TV screenshots, privacy labels, content rating, support email and reviewer instructions. Choose free distribution and no IAP/ads.
4. Test the release on a physical Fire OS TV, including older WebView compatibility, remote keys, resume/reconnect and QR readability. Submit after completing the console checklist.

## References

- Android TV distribution: https://developer.android.com/training/tv/publishing/distribute
- TV quality criteria: https://developer.android.com/docs/quality-guidelines/tv-app-quality
- Google personal-account testing: https://support.google.com/googleplay/android-developer/answer/14151465
- Amazon submission / Fire OS vs Vega: https://developer.amazon.com/docs/app-submission/submitting-apps-to-amazon-appstore.html
- Amazon testing criteria: https://developer.amazon.com/docs/app-testing/test-criteria.html
