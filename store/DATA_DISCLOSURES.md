# Store disclosure preparation

This is an implementation inventory for completing Google Data safety, Amazon Privacy Labels, content ratings and App access. It is not a completed or submitted questionnaire. Answer the consoles' current questions against their definitions and the complete companion-phone flow; do not automatically choose “no data collected” because the TV has no login.

| Data | App behavior |
| --- | --- |
| Lobby code and game settings | Sent to Convex to create, retrieve and operate games. Codes persist in backend game records. |
| TV control token | Random capability sent over HTTPS for authorized game controls; its SHA-256 hash persists in Convex. Original token stays in local TV storage. Never include it in logs, listing text, screenshots or reviewer instructions. |
| Game activity | Trades, fictional balances/holdings, period results and rankings persist in Convex and are public to people with the lobby code. |
| Player identity | The TV receives player-selected usernames and avatars. The companion website separately creates username/password accounts. Its internal `email` field contains a normalized username, not a requested email address. Do not classify it as collection of an email address without checking the actual input. |
| Private insights | The TV public API excludes these during trading. They become public in the market-close reveal. |
| Network metadata | Convex and Cloudflare process service requests; review their processing/logging before completing technical identifier and diagnostic declarations. No advertising or analytics SDK is bundled in the TV app. |
| Local storage | Up to 12 recent codes and associated TV control tokens. No cloud backup is enabled by the app. Clearing app data removes local control; it does not delete backend games or phone accounts. |

Uses: app functionality, phone authentication, continuity of games and security. No ads, ad identifiers, purchases, real-money trading, wagering, cash prizes, chat, camera, microphone, contacts or location permission are implemented in the TV app.

Policy/contact URL: https://stockmarket.samfelton.com/tv-privacy.html. Contact: mail.samfelton@gmail.com. Verify that the URL is live before submitting.

Phone accounts are created on the companion website reached by QR code, so disclose this linked creation flow. The dedicated request resource is https://stockmarket.samfelton.com/tv-privacy.html#deletion, which prominently offers an email request pathway without reinstalling the app. The TV also displays those instructions under Privacy & support. Requests are manually processed by the developer; there is no automated account-deletion endpoint. Do not describe the email route as immediate or automated deletion. The developer must handle verified requests and actually delete associated personal data, not merely deactivate accounts. Google's guidance expressly permits a customer-service email pathway and exempts TV apps from the in-app initiation requirement: https://support.google.com/googleplay/android-developer/answer/13327111.

Content ratings must be completed in each console. Describe the app as a fictional stockmarket board/party game, and disclose public player-selected names. Review the complete insight-card text and other shipped content before certifying age ratings or target audiences. No age rating or children's/families-program enrollment has been assumed here.
