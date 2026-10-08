#!/usr/bin/env bash
# Run on a network that can resolve the public host after applying HTTPS rules.
set -euo pipefail
origin="${1:-https://picklah.my}"
origin="${origin%/}"
body=$(mktemp)
headers=$(mktemp)
trap 'rm -f -- "$body" "$headers"' EXIT
fetch() {
  curl --silent --show-error --retry 3 --retry-all-errors --connect-timeout 5 --max-time 20 \
    -D "$headers" -o "$body" -w '%{http_code}' "$origin$1"
}
for path in / /food-wheel/ /guides/wheel-picker/ /privacy/; do
  [[ $(fetch "$path") == 200 ]]
  grep -Eq "<link[^>]+rel=\"canonical\"[^>]+href=\"$origin$path\"" "$body"
  ! grep -Eiq '<meta[^>]*name="robots"[^>]*content="[^"]*noindex' "$body"
  ! grep -Eiq '^X-Robots-Tag:.*noindex' "$headers"
done
[[ $(fetch /robots.txt) == 200 ]]
grep -Fq "Sitemap: $origin/sitemap.xml" "$body"
[[ $(fetch /sitemap.xml) == 200 ]]
grep -Fq "<loc>$origin/food-wheel/</loc>" "$body"
for pair in '/index.html /' '/food-wheel /food-wheel/' '/food-wheel/index.html /food-wheel/' '/privacy /privacy/' '/privacy/index.html /privacy/' '/guides/wheel-picker /guides/wheel-picker/' '/guides/wheel-picker/index.html /guides/wheel-picker/'; do
  read -r source target <<< "$pair"
  [[ $(fetch "$source") == 301 ]]
  location=$(sed -n 's/^[Ll]ocation: //p' "$headers" | tr -d '\r')
  [[ "$location" == "$target" || "$location" == "$origin$target" ]]
done
[[ $(fetch /seo-smoke-missing-page) == 404 ]]
# Synthetic valid ID checks the route's response header, not snapshot existence.
[[ $(fetch /w/abcdefghijklmnopqrstuv) == 200 ]]
grep -Eiq '^X-Robots-Tag:.*noindex' "$headers"
if [[ "$origin" == https://picklah.my ]]; then
  for variant in http://picklah.my/ http://www.picklah.my/ https://www.picklah.my/; do
    code=$(curl --silent --show-error --retry 3 --retry-all-errors --connect-timeout 5 --max-time 20 -D "$headers" -o "$body" -w '%{http_code}' "$variant")
    [[ "$code" == 301 || "$code" == 308 ]]
    # Certbot may redirect HTTP www to HTTPS www before canonicalizing the host.
    final=$(curl --silent --show-error --location --max-redirs 5 --connect-timeout 5 --max-time 20 -o "$body" -w '%{http_code} %{url_effective}' "$variant")
    [[ "$final" == '200 https://picklah.my/' ]]
  done
fi
printf 'SEO route, canonical, sitemap and exclusion checks passed.\n'
