# PickLah

PickLah is a responsive decision wheel for food, movies, games, and group choices. The first release is a guest-friendly React website/PWA with Android and iOS packaging through Capacitor.

## Project layout

- Go API at the repository root: Echo handlers, services, GORM repositories, PostgreSQL models.
- React + TypeScript + Vite app in `frontend/`.
- Capacitor configuration in `frontend/`; Android and iOS projects are generated there when native builds are started.
- Project scope and staged delivery plan in [PROJECT_PLAN.md](PROJECT_PLAN.md).

## Run locally

1. Install Go 1.22 or newer, PostgreSQL, and Node.js with npm.
2. Copy `.env.example` to `.env`, then set PostgreSQL connection values for your database.
3. Create the empty PostgreSQL database named by `POSTGRES_DATABASE`; the migration command creates tables inside an existing database.
4. Start the API from the repository root:

```powershell
go run .
```

The API listens on port 2001 by default. Set the PORT environment variable to change it.
Development startup runs GORM AutoMigrate by default; set POSTGRES_AUTO_MIGRATE=false to disable it. Run go run . migrate to apply the schema explicitly and exit.

5. Install and start the frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite development server proxies `/v1` calls to `http://127.0.0.1:2001`.

The wheel spins locally without the API. Publishing and opening shared links need a running API and database.

Tap a choice's color dot to customize its section color, emoji, or GIF. Paste an image from a compatible mobile keyboard/clipboard, choose an image file, or enter a direct HTTPS image URL. GIF, PNG, JPEG, and WebP files are supported up to 1 MB each and 2 MB per wheel. Mobile keyboard support depends on the keyboard and browser; the file picker is the fallback. Attached images are stored inline in the draft and shared snapshot. The default food wheel includes food emojis such as 🍔 for Burger. Customizations are saved on the device and included in shared snapshots; existing drafts and older shared wheels remain compatible.

Run the checks from their respective directories:

```powershell
go test ./...
cd frontend
npm test
npm run build
```

## API

The default food wheel includes Pan Mee 🍜, Nasi Lemak 🍛, Roti Canai 🫓, Chicken Rice 🍗, Bak Kut Teh 🍲, Satay 🍢, Sushi 🍣, and Burger 🍔. Choices without an emoji or custom image use the original PickLah wheel mascot from `frontend/public/picklah-emoji.png`. Custom media takes priority; clearing it restores the selected emoji or PickLah fallback.

- `GET /v1/templates` — built-in templates
- `POST /v1/wheels` — publish an immutable wheel snapshot
- `GET /v1/wheels/:publicId` — load an active snapshot

Set `PICKLAH_ALLOWED_ORIGINS` to a comma-separated list of browser and Capacitor origins for a deployment.

## Capacitor mobile builds

The frontend is bundled into native apps; app links use the website's HTTPS wheel URLs. Set `VITE_API_BASE_URL` to the reachable API and `VITE_PUBLIC_URL` to the canonical website origin before building mobile apps.

```powershell
cd frontend
npm install
npx cap add android
npx cap add ios
npm run cap:sync
npm run cap:android
npm run cap:ios
```

Android builds require Android Studio and its SDK. iOS builds require macOS and Xcode. Configure Android App Links and iOS Universal Links after choosing the production website domain.

Choice list files: use Import a file for TXT, CSV, XLSX, or XLS (up to 5 MB). TXT uses one entry per line; spreadsheets use the first column of the first worksheet. Review and edit the preview before adding; remove headers manually. Files are parsed locally and never uploaded. There is no fixed choice-count limit. Each choice is limited to 80 characters; browser storage and sharing request sizes still apply.

Consumer accounts: use Sign in to register with a username and password or use Google once the backend Google OAuth credentials are configured. See AUTH_SETUP.md for configuration, session behavior, and native limitations. Registration never uploads wheel drafts.

Deployment: `.github/workflows/deploy.yml` builds and deploys every push to `157.245.200.202` for `https://picklah.my`. See DEPLOYMENT.md for the one-time Nginx/systemd setup and required GitHub production SSH secrets. Server credentials stay in `/etc/picklah/picklah.env`.
