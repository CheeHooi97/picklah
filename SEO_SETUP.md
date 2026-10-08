# PickLah search setup

The homepage targets wheel picker / random picker / decision wheel searches. `/food-wheel/` offers an editable Malaysian food wheel. The public `/guides/wheel-picker/` page explains names, food, tasks, randomness, imports and sharing. All three contain readable HTML without requiring JavaScript; spinning requires JavaScript. Shared `/w/` snapshots remain excluded from indexing.

## Deploy and submit

1. Deploy the frontend build and the route changes from `deploy/picklah.my.conf`. Preserve the server's Certbot HTTPS configuration when applying Nginx changes; run `sudo nginx -t` before reloading.
2. Run `bash deploy/smoke-seo.sh https://picklah.my` from a network that resolves the domain. It checks the public pages, canonical links, sitemap, redirects, unknown-route 404 and shared-route exclusion header. The deployment workflow runs it after publishing. Also verify `/favicon.png` and open a real shared snapshot: the script's synthetic shared ID verifies only the route header.
3. In your verified Google Search Console property for `picklah.my`, submit `https://picklah.my/sitemap.xml` under Sitemaps.
4. Use URL Inspection to test the homepage, food wheel and guide, inspect Google's rendered content, and request indexing. Inspect the selected canonical URL and any exclusion reasons.
5. Check Search Console Performance for queries such as “wheel picker,” “random name picker,” “decision wheel,” and “what to eat wheel.” Compare impressions, clicks and average position across comparable periods, rather than repeatedly searching your own site.

Titles and content improve relevance but do not guarantee indexing or first-page rankings. Earn relevant links by sharing the useful tool and guide with communities that actually use it. Avoid paid ranking links, mass-generated keyword pages, and keyword stuffing.

## Measurement and remaining work

`first_spin` is emitted once per app mount with a fixed `page_type` of home, food or shared. `guide_to_tool` is emitted when a guide link opens the home or food tool, with fixed page/destination values. These custom events contain no choice labels, wheel titles, imported files, account data or shared IDs. GA4 ingestion and vendor automatic measurement settings must be verified in the actual property. Spinning uses the existing website tag; native apps do not load this guide script.

Compare comparable 28-day Search Console periods by page, query and country. Capture mobile field performance before choosing performance changes. AI citation sampling, Search Console submission and GA4 property checks require external access and were not automated here.

MuseCards (`gravure-model`) currently leaves its public correction/contact channel unconfigured. PickLah therefore does not publish an inferred personal email. A verified public maintainer name and support link remain pending; the privacy page retains its existing Play support instructions. No independent randomness certification is claimed.

Google references:
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/appearance/favicon-in-search
