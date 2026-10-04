# PickLah search setup

The homepage targets wheel picker / random picker / decision wheel searches. The public `/guides/wheel-picker/` page explains practical name, food, and task use cases. Both contain readable HTML without requiring JavaScript. Shared `/w/` snapshots remain excluded from indexing.

## Deploy and submit

1. Deploy the frontend build and the route changes from `deploy/picklah.my.conf`. Preserve the server's Certbot HTTPS configuration when applying Nginx changes; run `sudo nginx -t` before reloading.
2. Check that `/`, `/guides/wheel-picker/`, `/privacy/`, `/robots.txt`, `/sitemap.xml`, and `/favicon.png` return HTTP 200 publicly over HTTPS. Invalid routes should return 404.
3. In your verified Google Search Console property for `picklah.my`, submit `https://picklah.my/sitemap.xml` under Sitemaps.
4. Use URL Inspection to test the homepage and guide, inspect Google's rendered content, and request indexing. Inspect the selected canonical URL and any exclusion reasons.
5. Check Search Console Performance for queries such as “wheel picker,” “random name picker,” “decision wheel,” and “what to eat wheel.” Compare impressions, clicks and average position across comparable periods, rather than repeatedly searching your own site.

Titles and content improve relevance but do not guarantee indexing or first-page rankings. Earn relevant links by sharing the useful tool and guide with communities that actually use it. Avoid paid ranking links, mass-generated keyword pages, and keyword stuffing.

Google references:
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/appearance/favicon-in-search
