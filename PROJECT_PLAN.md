# PickLah — Project Plan

Status: MVP implementation underway — Phases 0–2 complete in code; Phase 3 in progress
Created: 3 October 2026
Updated: 3 October 2026 — MVP execution, PWA shell, and local validation status
Launch approach: React website → PWA → Android/iOS with Capacitor

## 1. The ridiculously simple idea

PickLah helps people make small everyday decisions together. Open the website, pick a template or enter your own options, and spin.

The first experience is **“What makan?”**

- 🍜 Pan Mee
- 🍛 Nasi Lemak
- 🍗 Chicken Rice
- 🍲 Bak Kut Teh
- 🍣 Sushi
- 🍔 Burger

One obvious action: **SPIN**.

The result should be clear, fun, and easy to share. People can also make their own wheel and share it through a URL.

Product promise: **“Cannot decide? PickLah.”**

## 2. Why this is worth exploring

There is evidence of demand for simple random decision tools:

- Semrush estimates Wheel of Names received **25.13 million visits in July 2026**, following 22.06 million in June. These are estimated visits, not unique users or revenue. [Source: Semrush](https://www.semrush.com/website/wheelofnames.com/overview/)
- Decision Roulette’s Google Play listing shows **50M+ downloads**. That is a cumulative download threshold, not a measure of active users. [Source: Google Play](https://play.google.com/store/apps/details?id=es.treebit.decisionroulette&hl=en_US)

Sources checked on 3 October 2026. These figures support exploring the category; they do not establish demand for PickLah or for a Malaysia-specific version.

Our hypothesis is that local food choices, familiar language, fast mobile use, and easy group-chat sharing can make PickLah useful to people in Malaysia and Southeast Asia.

## 3. Audience and positioning

Start with Malaysian friends, couples, families, students, and small office teams making casual decisions.

Common situations:

- Friends cannot agree on lunch.
- A group needs to choose who pays or who goes first.
- Housemates need to assign a task.
- People want a movie, game, party activity, or informal lucky draw.

Use Malaysia/SEA flavor through relevant templates and restrained copy: “What makan?”, “Where to eat?”, and “Spin lah”. Keep controls easy to understand for visitors unfamiliar with local slang.

Start with English interface copy and Malaysian examples. Prepare the text structure for Bahasa Melayu; add the translation after validating the initial experience.

## 4. Website, PWA, and Capacitor

A responsive website makes the product available immediately from a shared link on phones and desktops. Users should be able to spin without installing anything or signing in.

Recommended sequence:

1. Build the responsive website and the complete create → spin → share flow.
2. Add a web app manifest and installable PWA experience.
3. Cache the app shell and bundled templates for basic offline use.
4. Package the same frontend for Android and iOS with **Capacitor** after the web MVP is stable.

Offline users can spin bundled templates and locally saved wheels. Publishing a new share link and opening an uncached shared wheel require a connection. Explain this when the action is attempted.

The selected stack is **React + TypeScript + Vite for the UI, Capacitor for mobile packaging, and the existing Go API for persistence**. Capacitor runs the built web UI inside a native application and provides plugins for device features. Build the frontend, sync its assets into the platform projects, then build and validate each mobile app. [Source: Capacitor workflow](https://capacitorjs.com/docs/basics/workflow)

### Mobile implementation plan

- Keep one frontend for browser, PWA, Android, and iOS, including wheel logic and API contracts.
- Place platform-specific behavior behind small adapters for sharing, draft storage, and app-link handling.
- Use the browser share API when available, with copy-link fallback; use the Capacitor Share plugin inside mobile apps. [Source: Share plugin](https://capacitorjs.com/docs/apis/share)
- Share canonical HTTPS URLs on the public website domain. Configure Android App Links and iOS Universal Links so installed apps can open `/w/:publicId`; the website remains the fallback. Handle both cold-start links and links received while the app is open. [Source: Deep links](https://capacitorjs.com/docs/guides/deep-links)
- Bundle the frontend assets for mobile releases and point API calls to a configurable HTTPS backend URL.
- Use browser storage for web drafts and a persistent native storage adapter for mobile drafts. Share the draft schema and migration logic; do not assume drafts automatically sync between installations or platforms.
- Cache the website through its PWA service worker. Native builds use bundled assets and local drafts; configure service-worker registration for the web build only.
- Handle safe areas, the Android back button, app resume, and interrupted animations. Keep the chosen result consistent if the app is backgrounded during a spin.
- Add optional haptics after the core experience is stable.

Android development uses Android Studio and its SDK tooling. Local iOS builds require macOS and Xcode; this Windows workspace will need access to a Mac or suitable macOS CI for iOS releases. Include signing, icons, store metadata, and device checks in the mobile milestone. [Source: Capacitor workflow](https://capacitorjs.com/docs/basics/workflow)

## 5. Templates

| Template | Experience | Release |
| --- | --- | --- |
| What makan? | Spin the six starter food choices; allow edits | MVP default |
| Where should we eat? | Enter restaurant names and spin | MVP |
| Who pays today? | Enter participants and pick one | MVP |
| Who does the task? | Enter participants and pick one for a named task | MVP |
| What movie tonight? | Enter movie titles and spin | MVP |
| What game do we play? | Enter game names and spin | MVP |
| Truth or Dare | Pick truth or dare, then show a suitable prompt | Phase 5 |
| Random team picker | Shuffle participants into balanced teams | Phase 5 |
| Lucky draw | Pick names, optionally remove each winner | Phase 5 |

MVP templates use the same wheel engine with different titles and starter content. Movies, games, and restaurants are manual lists initially. Restaurant discovery and live catalog integrations are separate future features.

Random team picking needs a shuffle-and-distribute flow rather than a single winner. Lucky draws need explicit rules for repeat winners and duplicate entries. Truth or Dare needs its own reviewed prompt collection with a default suitable for general audiences.

## 6. MVP scope

### Essential features

- Open directly to a usable “What makan?” wheel.
- Choose one of the MVP templates.
- Create a wheel with a title and custom options.
- Add, edit, remove, or paste options one per line.
- Spin with a clear pointer, animation, and result.
- Spin again or edit the choices after a result.
- Save the current draft on the same device.
- Publish a wheel and copy its share URL.
- Open a shared wheel and spin immediately.
- Make an editable local copy of a shared wheel.
- Use the complete flow on small mobile screens and desktop.

### Initial rules

- Require at least 2 options with no fixed count cap, a title of at most 100 characters, and option labels of at most 80 characters.
- Trim whitespace and reject blank options.
- Give every option an equal probability.
- Flag duplicate labels and explain that each duplicate is a separate entry with its own chance. Do not silently remove entries.
- Disable another spin until the current result is displayed.
- Choose the result first and animate the wheel to that exact segment.
- Never change the winning option during the animation.

These limits are initial product decisions and can be adjusted after mobile usability checks.

### Later features

Accounts and cloud libraries, weighted choices, advanced themes, uploaded images, real-time group sessions, restaurant search, paid plans, advertising, and native apps can follow evidence of demand.

## 7. Main user journeys

### Quick decision

Open PickLah → see “What makan?” → tap SPIN → see the winning food → spin again or edit.

### Custom wheel

Choose “Create a wheel” → enter a title and choices → preview → spin → save the draft automatically on this device.

### Share a wheel

Finish editing → tap Share → publish a snapshot → receive a URL such as `/w/Ab3k9Qx7` → copy it or use the device share menu.

Recipients see the same title and options. Each recipient’s spin is independent; the URL shares a wheel, not a synchronized outcome.

### Reuse a shared wheel

Open a shared URL → spin the published wheel → choose “Make a copy” to customize a local draft → publish a new snapshot if needed.

## 8. Screens and UX

| Screen | Main content | Main action |
| --- | --- | --- |
| Home | Default wheel, title, template shortcuts | Spin |
| Wheel editor | Title, choices, preview, validation | Spin / Share |
| Shared wheel | Published title, choices, wheel | Spin |
| Result state | Winner, spin again, edit or copy | Spin again |
| Templates | Short descriptions of decision types | Use template |

On phones, prioritize the wheel and spin action, with the editor accessible below or through a clear edit control. Avoid requiring users to navigate through setup before their first spin.

Include keyboard operation, readable labels, visible focus, sufficient contrast, a text result announced to assistive technology, and reduced-motion support. Sound is optional and controlled by the user. The outcome must remain understandable without animation, sound, or color.

Handle empty lists, oversized input, long labels, unavailable storage, failed publishing, unavailable shared wheels, and connection loss with clear recovery actions. Preserve the draft when publishing fails.

## 9. Implemented architecture

The working tree now contains the first guest wheel flow using React + TypeScript + Vite, a Go + Echo + GORM API, and Capacitor adapters. The wheel itself spins locally; publishing and loading shared snapshots use the public API.

| Layer | Current implementation |
| --- | --- |
| Frontend | Responsive editor, built-in templates, local drafts, unbiased random selection, wheel animation, result announcement, share/copy flow, PWA shell |
| Capacitor | App identity/config, Preferences, Share, and App plugins; mobile platform projects and domain association files are not generated yet |
| Router | Public template and wheel routes under /v1; legacy user/admin routes remain behind company authentication |
| Handler | Wheel/template request binding, validation, response mapping, and stable API errors |
| Service | Wheel limits and normalization, template lookup, random public ID creation, active snapshot retrieval |
| Repository | Context-aware GORM persistence and ordered wheel options written in one transaction |
| Model and DTO | PickLah wheel snapshot and ordered options, separated from public JSON request/response types |
| Database | PostgreSQL with lowercase snake_case identifiers; explicit AutoMigrate covers User, Admin, Company, Wheel, and WheelOption |

The frontend and API structures below reflect the current files. This is an implementation review and local validation record, not a production security audit or production deployment.

### 9.1 Current repository structure — inspected 3 October 2026

- Root Go API: main.go; config/config.go; database/migrate.go; router/router.go.
- Go request and response types: dto/wheel.go.
- Go HTTP handlers: handler/ contains wheel endpoints and tests, shared handler wiring, and the retained legacy user/admin handlers.
- Go business logic: service/ contains wheel and template logic plus retained legacy services.
- Go persistence: repository/ contains the wheel interface/implementation and retained legacy repositories.
- Go domain and infrastructure: model/, middleware/, errcode/, utils/, transformer/.
- Frontend build and Capacitor configuration: frontend/package.json, vite.config.ts, capacitor.config.ts, and TypeScript configuration.
- Frontend entry and application: frontend/src/main.tsx and App.tsx.
- Frontend components: frontend/src/components/ChoiceEditor.tsx and WheelVisual.tsx.
- Wheel rules and persistence: frontend/src/features/wheel/ contains random selection, draft storage, built-in templates, types, and selection tests.
- API and platform adapters: frontend/src/api/wheels.ts and frontend/src/platform/share.ts.
- Web assets: frontend/public/ contains the manifest, service worker, and PickLah SVG mark.
- Project instructions: README.md, PROJECT_PLAN.md, root .env.example, and frontend/.env.example.

Dependency initialization is main → repository → service → handler → router. A request follows router → middleware → handler → service → repository → PostgreSQL. Wheel rules are in the wheel service, while local spinning and draft editing do not require the API.

The current repository has no Android or iOS project directories. Capacitor configuration and plugin adapters are present; native builds, app-store setup, and App Link association are later work.

### 9.2 Findings resolved and work that remains

| Status | Finding | Current state |
| --- | --- | --- |
| Resolved | An internal repository used an import path outside the declared PickLah module | Internal Go imports use the PickLah module path; go test ./... passes |
| Resolved | main.go started an outer Echo server around a second Echo instance, and signal handling ran after the blocking server call | One Echo instance now owns routes and a signal-aware graceful shutdown |
| Resolved | Migrations omitted Company, even though company authentication queries it | Startup migration includes Company plus Wheel and WheelOption |
| Implemented | Guest APIs were behind company authentication | GET /v1/templates, POST /v1/wheels, and GET /v1/wheels/:publicId are public |
| Implemented | Wheel API needed status validation and safe public errors | Wheel handlers map invalid input, unavailable IDs, and internal failures to the documented HTTP response shape |
| Implemented | Published options needed stable ordering and duplicate preservation | Options have explicit positions and are stored with the snapshot in one transaction |
| Implemented | Share IDs needed strong randomness and uniqueness constraints | IDs use crypto/rand; the database has a unique index and the service checks for collisions before insert |
| Implemented | Public requests needed size, origin, and abuse limits | The router limits bodies and allowed origins; wheel endpoints use in-memory fixed-window rate limits |
| Remaining | Legacy user/admin handlers have access-scope questions | Authentication checks company credentials but does not consistently scope legacy records to a company; review or remove these routes before public launch |
| Remaining | Legacy model lookups and handler naming have older conventions | Some legacy handlers still bind IDs indirectly, and handler/user_search copy.go remains; they are outside the wheel path |
| Remaining | Startup uses GORM AutoMigrate | Use reviewed, controlled migrations and a rollout/rollback plan before production data is introduced |
| Remaining | Rate limiting is process-local | Replace or supplement it with a shared limiter if the API runs on multiple instances |
| Checked | Credential hygiene and module naming | No storage service-account key is present in the current file tree; .gitignore excludes local secrets and generated output, and examples contain placeholders |

The guest wheel route set is deliberately small. Company account routes still exist, so they need an explicit retain/remove and authorization decision before the API is exposed as a public service.

### 9.3 Current layer contracts

1. Router registers endpoints and route middleware; it does not perform persistence.
2. Handler binds and validates DTOs, calls a service, and maps service outcomes to HTTP.
3. Service validates wheel bounds, trims and orders options, creates public IDs, and maps unavailable snapshots to a not-found error.
4. Repository uses request context with GORM and saves a wheel and its options transactionally.
5. Models describe database fields; DTOs define public JSON. Duplicate labels remain separate entries because position is stored independently.
6. TemplateService serves versioned built-in templates from Go configuration; templates do not need database rows.

The frontend API types follow the DTO contract. Web development uses the Vite same-origin proxy. Mobile builds can set VITE_API_BASE_URL and VITE_PUBLIC_URL; production values still need to be selected. Company credentials and database credentials are not shipped to the frontend.

### 9.4 Execution boundaries

- Go unit/API tests run without requiring a database connection. The configured PostgreSQL database and schema were created and migrated separately on 3 October 2026.
- Live localhost sharing was verified on 3 October 2026: publishing an attached GIF returned HTTP 201, loading the snapshot returned HTTP 200, and the 4,178-character image source was preserved. The migration now explicitly widens and verifies the image column as PostgreSQL text because AutoMigrate alone retained the old varchar limit.
- AutoMigrate runs when the API starts, so do not point the current development startup at production data.
- In-memory rate limits are not shared across API replicas.
- Public share links are unlisted snapshots, not private links; retention and removal rules still need to be set.
- The public hostname, HTTPS API deployment, CORS production origins, privacy information, backups, and operational monitoring are launch decisions that remain open.
- The initial migration attempt found that the configured PostgreSQL database did not exist. It was created through PostgreSQL's maintenance database, then `go run . migrate` completed successfully on 3 October 2026. The migration applied the current User, Admin, Company, Wheel, and WheelOption models. Database connection values remain in the ignored local `.env`.
## 10. Sharing and data model

Published wheels are immutable snapshots. Editing a local draft and publishing again creates a new URL. This avoids accounts and anonymous edit credentials in the MVP.

### Local draft — implemented schema version 1

The draft stores a title, template key, and ordered option strings. The web version uses localStorage; Capacitor uses Preferences and falls back to browser storage. Drafts belong to one browser or app installation and do not sync between devices.

### Published wheel — implemented

The current snapshot stores:

- Internal database ID and a unique random public ID.
- Schema version.
- Title and optional built-in template key.
- Ordered option rows with position and label; duplicate labels remain distinct.
- Per-option section color, emoji, and optional HTTPS image URL or embedded GIF/PNG/JPEG/WebP. Keyboard image paste and file selection are supported where exposed by the browser. Attached images are limited to 1 MB each and 2 MB per wheel; PostgreSQL stores the validated image source in a text column. Snapshot schema version 2 preserves these customizations; older snapshots use the default colors and inferred food icons.
- Created timestamp and active/unavailable status.

Public IDs use 128 random bits encoded as a 22-character URL-safe string, with a database unique index and a service-level collision precheck. Anyone with an unlisted link can open it; it is not private storage. The API does not store spin outcomes or participant activity.

Templates are served from Go configuration rather than database rows. Appearance settings, user accounts, and cross-device draft sync are not part of the current snapshot model.

### Implemented public API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | /v1/templates | List available templates |
| POST | /v1/wheels | Publish a validated snapshot; return its public ID and share URL |
| GET | /v1/wheels/:publicId | Retrieve an active snapshot |

The API validates and limits requests, applies per-process rate limits, and returns option labels as plain text. No delete/moderation endpoint or retention policy exists yet. Decide retention and removal before public launch and publish the policy in the sharing flow and privacy information.
## 11. Delivery phases and current execution status

### Phase 0 — Confirm the foundation (implemented; legacy route review remains)

- Selected React + TypeScript + Vite + Capacitor and documented the guest wheel/API contract.
- Fixed the stale Go module import, single-Echo startup, signal-aware shutdown, and migration wiring.
- Added local setup documentation and the PickLah frontend shell.
- The legacy user/admin routes remain and still need a retain/remove and access-scope decision before public launch.

### Phase 1 — Complete the local wheel experience (implemented)

- Built the responsive “What makan?” wheel, editor, built-in templates, and result state.
- Added cryptographically unbiased local selection and matching wheel animation.
- Added draft persistence, validation, accessible labels/result announcements, and reduced-motion styling.
- Confirmed the production build loads, template selection updates the wheel, and a spin settles on an announced result.

### Phase 2 — Publish and share (API and UI implemented; live-database acceptance pending)

- Added wheel models, migration entries, repository, service, handlers, DTOs, routes, request limits, and API tests.
- Added share-link creation, shared snapshot loading, and local-copy behavior to the UI.
- Unit and handler tests exercise publishing and retrieval through test repositories.
- A cross-device share round trip against a running PostgreSQL-backed API has not yet been verified.
- Local migration is blocked until the configured database engine and variable names match the Go backend; the attempted startup stopped before connection and made no changes.

### Phase 3 — Prepare the public launch (in progress)

- Added the PWA manifest, production-only service-worker registration, and an offline-capable app shell.
- Added responsive layout and validated the main template/spin flow in a production browser preview.
- Still needed: verify installation and offline behavior on target browsers, complete share-preview/metadata and accessibility checks, choose hosting/domain/database, validate the real API end-to-end, and publish privacy, retention, removal, and feedback information.
- Analytics, operational monitoring, and database backup/recovery are not configured.

### Phase 4 — Release Capacitor mobile apps (configuration started; apps not built)

- Capacitor config and App, Preferences, and Share plugin adapters are present.
- Android/iOS project directories have not been generated, synced, signed, or tested on devices.
- Choose production app identity/domain, configure Android App Links and iOS Universal Links, then build Android with Android Studio and iOS with macOS/Xcode or macOS CI.

### Phase 5 — Expand using feedback (not started)

Add Truth or Dare, balanced team picking, and lucky draws after the core release. Prioritize Bahasa Melayu, more SEA templates, or account-based saved wheels based on observed usage and feedback.

The first local implementation milestone is met for open → edit → spin. The share/API path is implemented, but its operational round trip remains dependent on a running database-backed API and deployment configuration.
## 12. Validation and launch criteria

### Completed in local execution

- go test ./... passes for the Go API, service, handler, and all packages.
- npm test passes all four wheel-rule and unbiased-selection tests.
- npm run build passes TypeScript checking and creates the production Vite bundle.
- The production browser preview loads the app, applies a built-in template, spins, and exposes the final choice as readable result text.
- A 354-pixel mobile viewport was checked for horizontal overflow; the page and wheel remain within the viewport.
- Go handler/service tests verify publishing and retrieval with test repositories, including validation and unavailable wheels.

### Still required before public launch

- Connect a staging PostgreSQL database and verify schema migration, publish, reload, unavailable-wheel, and failure behavior through the running API.
- Verify one-device publish → second-device open and retry behavior for network failures.
- Verify PWA install prompts, service-worker caching, offline spin after first load, and recovery when publishing without a connection.
- Finish keyboard-only, screen-reader, contrast, and reduced-motion checks across the main journeys.
- Review or remove legacy user/admin routes and fix company-level authorization scope before public API deployment.
- Replace process-local rate limits if the API uses multiple instances; set operational logs, alerting, database backup, and recovery.
- Choose the public website/API hostnames and CORS origins; provide privacy, retention, removal, and support information.
- Test native sharing, persistent drafts, safe areas, background/resume, Android navigation, and app links on Android and iOS devices before app release.
## 13. Measure whether people find it useful

Start with a small event set: template selected, spin completed, custom wheel created, share published, and shared wheel opened. Do not include option labels, participant names, or wheel titles in analytics events.

Track:

- **Activation:** visitors who complete a first spin.
- **Custom creation:** activated visitors who create a custom wheel.
- **Sharing:** created wheels that are published and opened by recipients.
- **Repeat usage:** returning visitors who spin again over time, using privacy-conscious measurement.
- **Reliability:** failed share requests and unavailable wheel requests.

Collect a baseline before setting growth targets. Ask early users what decision they used PickLah for and what slowed them down.

## 14. Distribution and monetization

Begin with friends, student groups, office lunch groups, and relevant Malaysian communities. Make WhatsApp sharing straightforward and use short demos of familiar situations such as lunch indecision.

Give useful templates their own discoverable pages over time. Measure whether recipients of shared links create or share their own wheels.

Keep the initial release free. Consider optional themes, organizer features, or paid saved libraries only after repeat usage supports them. Advertising should be evaluated against its impact on the fast decision flow.

## 15. Decisions to resolve before public launch

1. Decide whether to remove or properly scope the retained legacy user/admin/company routes before public deployment.
2. Verify the configured PostgreSQL host, SSL mode, migration privileges, and deployment environment.
3. Choose frontend/backend hosting and public domain.
4. Decide published-wheel retention and a practical removal process.
5. Confirm English-first launch and the timing of Bahasa Melayu support.
6. Validate the implemented visual direction with target users and refine it from feedback.
7. Choose the mobile app identifier, Android/iOS signing owners, and access to macOS tooling for iOS builds.

Local wheel milestone: **a guest opens PickLah, edits “What makan?”, and spins to a result.** Sharing is implemented in code; a live URL round trip still requires a running database-backed API and selected deployment settings.

### Choice icons and PickLah mascot

The default What makan? wheel contains Pan Mee, Nasi Lemak, Roti Canai, Chicken Rice, Bak Kut Teh, Satay, Sushi, and Burger, each with a food emoji. Users can choose their own emoji, GIF, or image. Choices without media or an emoji use the original PickLah wheel mascot in the editor, wheel, and result. The transparent mascot asset is included in the offline shell cache. Existing saved drafts retain their choices; select the What makan? template to load the updated defaults.


### Subscriber-only publication

Free and registered users keep wheels in device storage. Database publication is reserved for authenticated users with a server-verified active subscription and occurs only when sharing. The project currently has company API authentication but no consumer account or billing integration. Until those are configured, POST /v1/wheels is denied with SUBSCRIPTION_REQUIRED before any database write. Existing published wheels remain readable. The frontend explains the subscription requirement; local creation, imports, customization, and spinning remain available.


### Consumer accounts implemented

Username/password registration and login now use dedicated PickLah accounts with bcrypt hashes and revocable, seven-day server sessions. Google website sign-in uses a backend OAuth authorization-code flow, adapted from Musecards, with server-side OpenID Connect verification; configure GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and the callback URL in the backend .env to activate it. Account creation stores only account/session records and never uploads a wheel. Stripe/RevenueCat subscriptions still need billing integration; new wheel publication remains blocked. See AUTH_SETUP.md and SUBSCRIPTIONS.md for setup and outstanding native Google work.
