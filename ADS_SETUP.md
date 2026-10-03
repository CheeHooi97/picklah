# PickLah Android ads

Uses the same `@capacitor-community/admob` 8.1.0 plugin and serialized banner ownership pattern as Musecards. One 320×50 native banner occupies a compact labeled slot directly below the header, visible before the wheel title. The slot scrolls with the page; the native overlay is shown only when the entire slot is visible above the bottom navigation. Ads are removed during scrolling, while a text field is focused, while templates or a sign-in dialog are open, or while the app is in the background. At widths below 320 logical pixels only the reserved slot is shown. Consent is checked before requesting ads. The website does not initialize AdMob.

## Development

Google's demo Android app ID and banner ID are configured in the ignored `frontend/.env.mobile`. Build and sync with `npm run cap:sync`: this runs Vite with `--mode mobile` and loads that file. Android Gradle reads the app ID from the same env files; `.env.mobile.local` can override `.env.mobile`. Ordinary `npm run build` remains the website build. For a local browser layout preview, run `npm run dev -- --mode mobile` with `VITE_ADS_PREVIEW=true`; this displays the placeholder without loading the native SDK. Preview is development-only.

## Production

Create a **PickLah** app and banner ad unit in AdMob. Do not reuse Musecards' placements.

- Set `VITE_ADMOB_ANDROID_APP_ID` in `frontend/.env.mobile`, or override it with a shell environment variable or `-PPICKLAH_ADMOB_APP_ID=ca-app-pub-...~...` for Gradle.
- Set `VITE_ADMOB_ANDROID_BANNER_ID=ca-app-pub-.../...` and `VITE_ADS_USE_TEST_IDS=false` in the same file. An empty production banner ID leaves only the placeholder and makes no ad requests.
- Configure AdMob Privacy & messaging for PickLah so the SDK can determine whether it may request ads. Consent-required users see Google's consent form. When required by the SDK, Choices includes an **Ad privacy options** button to revisit that decision.
- Rebuild the web assets, sync Android, and rebuild the APK after configuration changes.

Only Android is wired in this project. iOS requires its own native app ID and platform setup. Subscription entitlements are not implemented in PickLah, so this change does not claim an ad-free subscription tier.

Reference: [Musecards AdBanner](https://github.com/CheeHooi97/musecards/blob/main/frontend/src/components/AdBanner.jsx), [AdMob plugin setup](https://github.com/capacitor-community/admob).
