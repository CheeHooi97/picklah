#!/usr/bin/env bash
set -euo pipefail

release_id="${1:-}"
[[ "$release_id" =~ ^[0-9a-f]{40}-[0-9]+-[0-9]+$ ]] || { echo 'Invalid release ID' >&2; exit 1; }
staging="/tmp/picklah-deploy-$release_id"
release="/opt/picklah/releases/$release_id"
test -s "$staging/release.tgz"
test -s /etc/picklah/picklah.env
test -f /etc/systemd/system/picklah-api.service
nginx -t
install -d -m 755 /opt/picklah/releases
mkdir -m 755 -- "$release"
tar --no-same-owner -xzf "$staging/release.tgz" -C "$release"
test -s "$release/picklah-api" && test -s "$release/dist/index.html"
chmod 755 "$release/picklah-api"
chmod -R a+rX "$release/dist"
previous="$(readlink -f /opt/picklah/current 2>/dev/null || true)"
# Existing tabs may request an older content-hashed lazy bundle after a release.
if [[ "$previous" == /opt/picklah/releases/* && -d "$previous/dist/assets" ]]; then
  cp -an "$previous/dist/assets/." "$release/dist/assets/"
fi

# Load credentials through systemd, never through a release or Actions runner.
systemd-run --quiet --wait --collect --unit="picklah-migrate-$release_id" \
  --property=User=picklah --property=Group=picklah \
  --property=EnvironmentFile=/etc/picklah/picklah.env \
  --property="WorkingDirectory=$release" "$release/picklah-api" migrate

ln -s "$release" /opt/picklah/current.next
mv -Tf /opt/picklah/current.next /opt/picklah/current
healthy=false
if systemctl restart picklah-api; then
  for attempt in {1..20}; do
    if systemctl is-active --quiet picklah-api && curl -fsS --max-time 3 http://127.0.0.1:2001/v1/templates -o /dev/null; then
      healthy=true
      break
    fi
    sleep 2
  done
fi
if [[ "$healthy" != true ]]; then
  if [[ "$previous" == /opt/picklah/releases/* && -s "$previous/picklah-api" ]]; then
    ln -s "$previous" /opt/picklah/current.rollback
    mv -Tf /opt/picklah/current.rollback /opt/picklah/current
    systemctl restart picklah-api || true
    echo 'Restored previous release; schema changes are not rolled back.' >&2
  else
    systemctl stop picklah-api || true
  fi
  echo 'Deployment failed: API did not become ready.' >&2
  exit 1
fi
echo "Published PickLah release $release_id"
