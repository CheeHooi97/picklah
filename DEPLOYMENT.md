# Deploy PickLah to picklah.my

Target: `157.245.200.202`, domain `picklah.my`.

This follows Musecards' deployment pattern: GitHub Actions builds Go and Vite, uploads a release over SSH, publishes through systemd, and serves the website through Nginx. It assumes a Debian/Ubuntu Linux server with systemd, matching the tools used by Musecards. The actual server has not been accessed during this change.

## Automatic deployment

`.github/workflows/deploy.yml` runs on every push to any branch or tag, plus manual dispatch. It builds the exact pushed commit and deploys production. Deployments are serialized; GitHub can replace older pending runs with the latest pending run. There are no path filters, so documentation pushes trigger deployment too. To deploy only main later, add `branches: [main]` under push.

The workflow contains builds and deployment readiness checks, not a test suite. GitHub Actions production environment approvals must be disabled if deployment should require no manual approval.

## GitHub production secrets

Create a `production` environment in CheeHooi97/picklah with the same SSH secret names as Musecards:

| Secret | Value |
| --- | --- |
| DEPLOY_USER | Same server SSH username used by Musecards |
| DEPLOY_SSH_KEY | Private deployment key authorized for that user |
| DEPLOY_KNOWN_HOSTS | Verified SSH known_hosts entry for 157.245.200.202 |
| DEPLOY_HOST | Optional; defaults to 157.245.200.202 |
| DEPLOY_PORT | Optional; defaults to 22 |

Repository-scoped Musecards secrets do not automatically appear in PickLah. Add equivalent values to PickLah, or grant PickLah access to existing organization secrets. GitHub does not let this setup retrieve existing secret plaintext from Musecards.

The SSH user must be able to run deployment commands through `sudo -n`, as Musecards' deployment does. The app itself runs as a separate unprivileged `picklah` user. Set the GitHub variable DEPLOY_ARCH to arm64 only if the server is ARM; amd64 is the default.

## One-time server setup

Use the existing Nginx installation. Copy this project's deploy directory onto the server, then run:

```bash
sudo bash deploy/setup-server.sh
sudoedit /etc/picklah/picklah.env
```

The setup adds only the PickLah site/service. It leaves existing Musecards site files alone and preserves an existing PickLah environment file or Nginx site. The shared server must have port 2001 available; PickLah binds that API port to 127.0.0.1. If it is occupied, change PORT, Nginx proxy_pass, and the readiness URL in publish-release.sh together.

Fill the PostgreSQL settings using PickLah's database. Create the database and database user first; migrations create tables but do not create the database. For an external database, set POSTGRES_SSLMODE to the required provider mode, usually require. Keep credentials only in /etc/picklah/picklah.env, owned by root with mode 600.

Production Google settings:

```dotenv
ENV=production
HOST=127.0.0.1
PORT=2001
PICKLAH_SITE_URL=https://picklah.my
PICKLAH_ALLOWED_ORIGINS=https://picklah.my,https://www.picklah.my
GOOGLE_OAUTH_CLIENT_ID=your-google-web-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret
GOOGLE_OAUTH_REDIRECT_URL=
```

Register `https://picklah.my/v1/auth/oauth/google/callback` as an authorized redirect URI in Google Cloud. A blank redirect setting derives that URL automatically. No Google credentials are bundled into frontend JavaScript or deployment archives.

## DNS and HTTPS

1. Point the DNS A record for picklah.my to 157.245.200.202. If using www, point it to the same server or use a CNAME to picklah.my. Remove stale AAAA records unless this server has matching IPv6 routing.
2. Allow TCP 80 and 443 in the existing server/provider firewall.
3. Install Certbot's Nginx integration if it is not already available, then issue the certificate:

   ```bash
   sudo certbot --nginx -d picklah.my -d www.picklah.my --redirect
   ```

   Omit www if you have not configured its DNS. Follow Certbot's prompts yourself, including its agreement. Confirm its certificate renewal timer is enabled.

4. If www is enabled, redirect its HTTPS server block to https://picklah.my so authentication and local drafts use one canonical origin.

Do this before enabling the first automatic deployment: the workflow requires https://picklah.my to be reachable. Do not replace the installed Nginx site after Certbot adds TLS; subsequent deployments do not overwrite it.

## Release behavior

- Releases live under /opt/picklah/releases/<commit>-<run>-<attempt>.
- Each release explicitly migrates the schema with the server environment before switching the current symlink.
- The API is restarted and checked before the workflow checks the public HTTPS site and API.
- If the new API fails, the previous app release is restored when available. Schema changes are not rolled back; maintain database backups and backward-compatible migrations.
- Old hashed frontend assets are retained for already-open browser tabs.
- The workflow leaves old releases available for rollback. Review disk usage and remove obsolete releases manually.
- Free/registered wheel drafts stay on-device. Subscriber sharing remains blocked until Stripe/RevenueCat integration is completed.

For a manual rollback:

```bash
# Replace RELEASE_ID with an existing good release directory name.
sudo ln -s /opt/picklah/releases/RELEASE_ID /opt/picklah/current.rollback
sudo mv -Tf /opt/picklah/current.rollback /opt/picklah/current
sudo systemctl restart picklah-api
```

## Activation status

Workflow and deployment files are prepared locally. No Git commit/push, GitHub secret setup, DNS changes, SSH connection, or live deployment has been performed. Commit and push the project after completing server setup and secrets; the first push containing the workflow triggers it.
