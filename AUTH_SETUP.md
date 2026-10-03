# PickLah accounts

## Implemented

- Username/password registration and login, Google sign-in on the website, current account, and logout.
- Registration displays Sign up with Google; login displays Sign in with Google. Both start the backend OAuth redirect flow and create an account only on the first successful authentication. Each attempt generates a new state, nonce, and PKCE verifier.
- Usernames are case insensitive: 3–32 ASCII letters, numbers, or underscores.
- Passwords are hashed with bcrypt cost 12; accepted length is 10–72 bytes. Passwords and hashes are never returned in API responses.
- Seven-day server sessions use random tokens in HttpOnly, SameSite=Lax cookies. The database stores only token hashes; successful authentication rotates the browser session and logout revokes it.
- Cookies are Secure when ENV is not development. Use HTTPS and ENV=production for deployed accounts.
- Google signatures, audience, issuer, expiration, verified email, and a server-issued nonce are validated before creating a session. Google accounts are identified by Google's subject ID, not an email address. Password accounts are not automatically linked by matching email.
- Account and session records are separate from wheels. Registration and login do not upload drafts. Subscription publication remains blocked until Stripe/RevenueCat integration is implemented.

## Database

Run `go run . migrate` to create `picklah_accounts` and `picklah_account_sessions`. The configured database was migrated during implementation.

## Google setup

PickLah now follows Musecards' backend authorization-code redirect approach. No frontend Google SDK or Google environment setting is required, but server credentials are required.

1. Create a Google Cloud OAuth consent screen and a Web application OAuth client.
2. Add the exact authorized redirect URI: `http://127.0.0.1:5173/v1/auth/oauth/google/callback`.
3. Set these values in the ignored backend `.env`:

   ```dotenv
   PICKLAH_SITE_URL=http://127.0.0.1:5173
   GOOGLE_OAUTH_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
   GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
   # Optional override; blank generates the callback from PICKLAH_SITE_URL.
   GOOGLE_OAUTH_REDIRECT_URL=
   ```

4. Restart the API. Open PickLah using the same host as PICKLAH_SITE_URL so session cookies and device drafts use the same origin. To use localhost instead, change PICKLAH_SITE_URL and register the resulting callback in Google Cloud. A non-empty GOOGLE_OAUTH_REDIRECT_URL overrides the generated callback.
5. Add the HTTPS deployment callback when deploying. Configure consent-screen test users while the OAuth app is in testing. Client secrets belong only on the backend.
6. Without both a client ID and secret, the button returns a clear unavailable message. Password login continues to work. GOOGLE_CLIENT_ID is accepted as a legacy fallback for the client ID only.

### Musecards findings

Inspected the GitHub main branch at commit `47ec51346537de5da7b16cbec61faa571aecc5b8`:

- [Frontend AuthPage](https://github.com/CheeHooi97/musecards/blob/47ec51346537de5da7b16cbec61faa571aecc5b8/frontend/src/pages/AuthPage.jsx) navigates to the backend's OAuth start URL.
- [Backend OAuth handlers](https://github.com/CheeHooi97/musecards/blob/47ec51346537de5da7b16cbec61faa571aecc5b8/backend/handler/oauth.go) require client ID and secret, exchange a code, resolve an account, and set a session cookie.
- [Backend config](https://github.com/CheeHooi97/musecards/blob/47ec51346537de5da7b16cbec61faa571aecc5b8/backend/config/config.go) reads GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REDIRECT_URL. These names are missing from its checked-in .env.example; that does not mean the implementation works without credentials. Deployment configuration was not inspected and no Musecards secrets were copied.

Android Google login uses Credential Manager through the local `PicklahGoogle` Capacitor plugin. It retrieves the public Web OAuth client ID from the backend, requests a five-minute, single-use nonce, and sends Google's ID token to the backend for verification. Android account requests use CapacitorHttp so HttpOnly server session cookies are retained by the native cookie store. Website authentication continues using the existing OAuth redirect flow. iOS Google sign-in remains unimplemented.

### Android deployment

1. Deploy the updated API and run `go run . migrate` when automatic migration is disabled. This adds `picklah_google_challenges`, which holds hashed, expiring sign-in nonces. Your existing `GOOGLE_OAUTH_CLIENT_ID` is reused; native token verification does not need a new server secret.
2. In the **same Google Cloud project** as that Web client, register an **Android OAuth client** with package name `com.picklah.app` and the signing certificate SHA-1. Register the debug certificate for local APK testing and the Google Play app-signing certificate for Play releases. The Android client ID is not the server client ID: the app requests an ID token for the existing Web client.
3. Android authentication defaults to `https://picklah.my`; `VITE_API_BASE_URL` (or `VITE_PUBLIC_URL`) can override it with another HTTPS API host. No Google client secret or separate Google frontend environment variable is required. Run `npm run cap:sync`, then rebuild and install the Android APK. Updating only the website does not update an installed app.
4. Use a device or emulator with Google Play services. Test Google login, account state after restarting the app, logout, cancellation, and signing in with another account.

`GET /v1/auth/config` returns `nativeGoogleConfigured` and the public `googleClientId`. An older backend does not provide these fields and the app leaves Google login unavailable until it is updated. `POST /v1/auth/google/native/challenge` issues a nonce; `POST /v1/auth/google/native` accepts `{idToken, nonce}` and sets the same seven-day session cookie as password login. A consumed or expired nonce cannot be reused. A failed attempt requires a fresh challenge.

## API

Google accounts retain a generated internal username for uniqueness. Account responses also include `displayName` when provided by the verified Google profile, and the header displays that name. Existing Google accounts refresh their display name on their next Google login. Password accounts continue displaying their username.

Deploy this change with the account schema migration (`go run . migrate`) before starting the updated API when automatic migration is disabled. This adds `display_name` to `picklah_accounts`; it does not rename accounts or change their IDs.

| Method | Endpoint | Action |
| --- | --- | --- |
| POST | `/v1/auth/register` | `{username, password}` → account and session cookie |
| POST | `/v1/auth/login` | `{username, password}` → account and session cookie |
| GET | `/v1/auth/config` | Whether backend Google OAuth is configured |
| GET | `/v1/auth/oauth/google/start` | Start Google registration/login; sets flow cookie and redirects |
| GET | `/v1/auth/oauth/google/callback` | Verify state, exchange code, verify identity, set session, return to PickLah |
| GET | `/v1/auth/me` | Current account or null |
| POST | `/v1/auth/logout` | Revoke browser session |

POST requests require application/json. Registration and login endpoints are rate limited. Account responses are not cached. Browser requests use credentials=include and an explicit allowed-origin list.

## Remaining work

- Stripe/RevenueCat billing and entitlement checks tied to `account.id`.
- Password recovery, account management, and explicit Google/password account linking.
- iOS Google identity integration and session transport.
- End-to-end Google sign-in verification with the deployed API and registered Android signing certificates.

Google identity verification uses an OpenID Connect verifier. Authorization codes are exchanged only by the backend, following [Google's web server OAuth guidance](https://developers.google.com/identity/protocols/oauth2/web-server). The return URL contains a result code, never a session token. The requested wheel route is retained and the existing local draft is restored on return.
