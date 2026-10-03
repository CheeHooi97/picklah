#!/usr/bin/env bash
# One-time Debian/Ubuntu setup. Run from a checkout as root after reviewing it.
set -euo pipefail
[[ "$EUID" == 0 ]] || { echo 'Run with sudo.' >&2; exit 1; }
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
command -v nginx >/dev/null || { echo 'Install nginx before running this script.' >&2; exit 1; }
id picklah >/dev/null 2>&1 || useradd --system --home-dir /opt/picklah --shell /usr/sbin/nologin picklah
install -d -m 755 /opt/picklah /opt/picklah/releases
install -d -m 700 /etc/picklah
if [[ ! -e /etc/picklah/picklah.env ]]; then
  install -m 600 "$script_dir/picklah.env.example" /etc/picklah/picklah.env
fi
install -m 644 "$script_dir/picklah-api.service" /etc/systemd/system/picklah-api.service
if [[ ! -e /etc/nginx/sites-available/picklah.my ]]; then
  install -m 644 "$script_dir/picklah.my.conf" /etc/nginx/sites-available/picklah.my
fi
ln -sfn /etc/nginx/sites-available/picklah.my /etc/nginx/sites-enabled/picklah.my
nginx -t
systemctl daemon-reload
systemctl enable picklah-api
systemctl reload nginx
echo 'Fill /etc/picklah/picklah.env, configure HTTPS, then run the workflow.'
