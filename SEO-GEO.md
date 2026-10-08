# PickLah SEO and GEO audit

Reviewed: **8 October 2026 (Asia/Singapore)**

Website: [picklah.my](https://picklah.my/)

GEO means **generative engine optimization**: helping AI search systems discover, understand and cite useful public content.

## Implementation status

Implemented in the working tree on 8 October 2026: `/food-wheel/` with public HTML and metadata, saved-draft preservation and explicit template/undo controls, guide answers and review date, homepage/guide internal links, guide structured data, analytics disclosure, fixed-parameter measurement events, sitemap entry, duplicate URL redirects and deployment SEO smoke checks. Offline public-page handling now preserves each page's content rather than falling back to the homepage.

The web and mobile entry points remain separate. See `SEO_SETUP.md` for deployment and measurement instructions. Live Nginx configuration, Search Console indexing/submission, analytics ingestion, field performance and AI citations still need external verification. MuseCards' public contact channel is unconfigured, so a verified support identity/link remains pending. Recommendations below preserve the original audit observations; they are not claims that the changes have reached production.

Validation: web and mobile production builds passed; all 14 existing frontend tests passed. Playwright with headless Chromium verified metadata, saved drafts, template replacement/undo, repeated spins, fixed analytics event parameters, guide navigation, shared-route exclusions, console health and desktop/mobile layouts (1440 × 1000 and 390 × 844). The food page's explanatory content and indexable metadata were also checked with JavaScript disabled. API responses and external analytics scripts were stubbed, so these checks do not establish backend behavior or vendor event ingestion. Built HTML/JSON-LD parsing and Bash smoke-script syntax checks passed. Production smoke execution remains pending.

## Your next moves

1. Verify the production routes and indexing controls before expanding content. Repository configuration is present; its deployment remains unverified.
2. Test one useful food-wheel landing page, built around PickLah's existing Malaysian food template.
3. Strengthen the existing guide with a concise explanation of randomness, sharing and imports, plus clear ownership and contact information.

These priorities reflect product fit and source evidence, not measured search demand or a forecast of traffic.

## Scope and limits

This is a source-based website audit with attempted production checks and limited public search research. No OpenSEO connection, Search Console data, analytics access, keyword-volume data or backlink dataset was available. The requested Markdown format is used instead of the SEO skill's HTML report workflow.

The web reader could not access the homepage, guide or privacy page. Local HTTP attempts failed DNS resolution for `picklah.my` and `www.picklah.my`. **This does not establish a public outage**: networking restrictions or the audit environment may be responsible. Production status codes, redirects, rendered layout, indexing, Core Web Vitals and AI citations remain unknown. No live browser visual audit was completed.

Business inferred from the repository: a guest-friendly decision wheel for food, names, movies, games and group tasks. Malaysia is a plausible initial audience because of the domain, Malaysian food template and language; broader English-speaking use is supported by the product. Audience size and geographic traffic are unknown.

## What is already working

| Area | Verified source evidence | Implication |
| --- | --- | --- |
| Homepage metadata | Descriptive title, meta description, canonical URL, English language declaration and social previews in `frontend/index.html` | Basic search and sharing information already exists. |
| Readable public content | Homepage instructions and FAQs sit outside React's root; `main.tsx` preserves them on the web homepage | Important explanatory text does not depend on React rendering. |
| Guide | Static HTML at `/guides/wheel-picker/`, with examples, repeat behavior and links to the tool | Preserve this useful foundation rather than replacing it with generic marketing copy. |
| Discovery | Sitemap includes homepage, guide and privacy; homepage links to guide | The current public page set has explicit discovery paths. |
| Shared wheels | Server template adds `X-Robots-Tag: noindex, follow`; client removes canonical and structured data on non-home app paths | Intentional shared-wheel exclusion is implemented in source. |
| URL handling | Nginx template redirects www and `/index.html`, normalizes guide/privacy slashes and returns 404 for missing files | Intended behavior avoids many duplicate URLs and false successful responses. |
| Structured data | Homepage includes WebSite and WebApplication JSON-LD | Search systems receive machine-readable descriptions of the site and app. |
| Product distinction | Malaysian food choices, imports, customization and no-repeat rounds are implemented | These are concrete subjects for useful landing pages and answers. |

Canonical means the preferred URL declared by a page. Structured data means machine-readable facts about its content. Neither guarantees indexing or enhanced search appearance.

## Priority 1: verify production discovery and exclusions

**Finding:** `README.md` and `SEO_SETUP.md` explicitly say the SEO server rules must be merged into the active HTTPS configuration. The deployment workflow builds and publishes assets, but its public smoke checks cover the homepage and templates API. They do not establish that the guide, sitemap, redirects or indexing headers work.

**Action:** run the following checks from a network that can resolve the domain, then inspect the public pages in Search Console.

| Request | Expected production behavior |
| --- | --- |
| `/`, `/guides/wheel-picker/`, `/privacy/` | HTTP 200; intended content; correct self-canonical; no accidental `noindex` |
| `/robots.txt`, `/sitemap.xml` | HTTP 200; correct content types; canonical domain references |
| HTTP and www variants | Permanent redirect to the equivalent HTTPS non-www URL |
| `/index.html` | Permanent redirect to `/` |
| `/guides/wheel-picker` and `/privacy` | Permanent redirects to their trailing-slash URLs |
| A deliberately unknown path | HTTP 404, without a successful homepage fallback |
| A real active `/w/<publicId>` link | Working shared wheel; response includes `X-Robots-Tag: noindex, follow` |
| `/guides/wheel-picker/index.html`, `/privacy/index.html` | Check duplicate file URLs; preferably redirect to the clean canonical URLs |

The generic file-serving rule appears to allow direct guide/privacy `index.html` URLs. Their canonical tags already point to clean URLs; redirects would make the policy consistent. This is a maintenance opportunity, not evidence of lost traffic.

Submit the sitemap, inspect Google's selected canonical and rendered content, and record exclusion reasons. Preserve Certbot configuration when merging Nginx rules; validate with `nginx -t` before reloading. Expand deployment smoke checks to cover these public routes and headers.

**Benefit:** confirms that existing discovery controls actually reach visitors and crawlers. If externally verified checks fail, fix those failures before content expansion. The audit has not demonstrated an indexing blocker.

## Priority 2: test a Malaysian food-wheel page

**Finding:** six built-in templates are selectable through buttons in `App.tsx`, but they have no dedicated public landing URLs. The guide combines names, food and tasks on one page. This limits the number of distinct use cases that have their own searchable explanation and usable entry point.

**Proposed first page:** `/food-wheel/`

**Suggested title:** `What to Eat Wheel — Malaysian Food Picker | PickLah`

**Suggested H1:** `Cannot decide what to eat? Spin a food wheel`

Include:

- A working wheel initialized with the existing What makan? choices.
- Editable options and an explicit explanation that the wheel selects from the user's list.
- Malaysian lunch examples, including nasi lemak, pan mee, chicken rice and roti canai.
- Advice to remove unsuitable options before spinning, without claiming dietary verification.
- Short answers about repeat picks, local drafts, sign-in and sharing.
- Links to the main wheel and existing guide, plus links back from those pages.

Do not imply that PickLah finds nearby restaurants, checks opening hours, or verifies halal status. The existing guide correctly says it does not look up availability or dietary information.

**Implementation requirement:** serve meaningful HTML, provide a self-canonical and unique metadata, and add the URL to the sitemap. Update `seo.ts`, the inline path checks in `index.html`, `main.tsx` and production routing: the current app logic treats every non-home path as excluded from indexing and removes its homepage guide. Adding a React route alone is insufficient. Preserve exclusions for shared wheels and unknown routes. Define template initialization so a landing-page visit does not silently overwrite an existing local draft.

**Why first:** this uses an existing distinctive template and a specific decision people can complete immediately. A random-name page is the strongest runner-up, but public search research surfaced numerous dedicated name-picker tools; the food page offers a more specific product angle. Relative demand remains unmeasured.

## Priority 3: make the existing guide easier to cite and trust

**Finding:** the guide already answers practical questions well. It lacks a detailed randomness explanation, visible editorial ownership/update information and a direct contact route. Its draft-storage section does not explain the separate behavior of published shared wheels, although the privacy policy does.

Add concise, standalone answers under descriptive headings:

| Question | Source-supported answer to develop |
| --- | --- |
| How does PickLah choose a winner? | The browser's cryptographic random generator selects an eligible entry before the animation lands on it. The code rejects values that would introduce modulo bias. |
| Does every entry have the same chance? | Each eligible entry has equal selection probability under the implemented algorithm. Duplicate labels count as separate entries. |
| Can an entry win twice? | Yes by default. No-repeat mode excludes the previous winner when the next spin starts; restarting restores entries. |
| Are drafts uploaded? | Drafts stay on the device; signing in does not automatically upload them. Publishing a shared wheel sends its content to the server. |
| How are spreadsheets imported? | Imports use the first column of the first worksheet; review the preview and remove headers manually. |

Use accessible prose for these answers. Do not describe the tool as independently audited, certified, tamper-proof or suitable for regulated draws. The algorithm inspection supports its mechanism, not those broader claims.

Add a real maintainer identity, review date and direct support link. The privacy page currently refers users to the support contact on a Google Play listing without linking that listing. Supply a verified direct route and accurately disclose the web analytics already included in `index.html`. Treat that disclosure as a trust/documentation improvement, not a ranking guarantee or legal conclusion.

An optional About page can explain who maintains PickLah and how to contact them. Add truthful publisher identity and appropriate page structured data only when the same facts are visible on the page. Keep existing stable homepage schema identifiers. Do not add fabricated ratings or credentials.

**Benefit:** gives readers and answer systems precise explanations they can reference. Citation gains are plausible but unproven; measure them separately from organic traffic.

## Keyword and page map

These are research candidates, not measured volumes, difficulty scores or ranking claims. Validate with Search Console and country-specific keyword research before building every page.

| Intent cluster | Destination | Decision |
| --- | --- | --- |
| wheel picker, random picker, decision wheel | `/` | Keep the current broad tool positioning. |
| how to use a wheel picker, pick without repeats | `/guides/wheel-picker/` | Expand the existing guide with precise answers. |
| what to eat wheel, food picker, Malaysian food wheel | Proposed `/food-wheel/` | First landing-page experiment after production verification. |
| random name picker, name wheel, no-repeat name picker | Proposed `/random-name-picker/` | Runner-up; validate impressions/demand and build a distinct useful experience. |
| task picker, movie picker, game picker | Existing guide/templates initially | Defer separate pages until demand or usage supports them. |

Avoid making near-identical pages for every synonym or Malaysian city. Consider a Bahasa Melayu version only with an accurate translation and genuine audience need; use separate language URLs and reciprocal language annotations if implemented.

## GEO and crawler policy

Google states that its AI search features rely on ordinary SEO foundations, with no special AI file or schema requirement. Focus on accessible text, useful pages, internal links and accurate structured data. [Google AI search guidance](https://developers.google.com/search/docs/appearance/ai-features).

The repository's `robots.txt` allows public crawling and disallows `/v1/`; it has no separate AI-agent groups. Check CDN and firewall behavior too. OpenAI distinguishes OAI-SearchBot for search discovery from GPTBot for training; choose access policy separately for each purpose. Robots permissions alone do not verify actual access. [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots).

Keep shared wheels excluded from indexing and outside the sitemap. A `noindex` directive is not access control: anyone with an active shared link can still view its contents. Do not expose private wheel content in public examples.

`llms.txt` is optional experimentation, not a leading recommendation. It cannot substitute for readable public pages or guarantee citations. Likewise, FAQ markup does not guarantee either a rich result or an AI citation.

## What else was checked

| Opportunity | Finding | Decision |
| --- | --- | --- |
| Random-name landing page | Real implemented functionality; many dedicated competitors appeared in research | Runner-up; food is more distinctive, although comparative demand is unknown. |
| New homepage title/description | Both already describe wheel picking and no-sign-in use | Preserve until query and click-through data justify a change. |
| Homepage heading | Static H1 describes the product; React replaces it with the editable wheel title | Retain a visible stable product heading in rendered explanatory content; minor clarity improvement. |
| Guide schema/social metadata | Guide has canonical and Open Graph data, but no JSON-LD | Optional semantic consistency; below content and discovery work. |
| Social image | Existing previews use mascot/favicon images | Consider a legible wheel preview image; sharing improvement rather than a search ranking fix. |
| Performance | No field or Lighthouse measurements obtained | Measure mobile loading and interaction before claiming a speed defect. |
| README accuracy | Search section says sitemap lists homepage, but XML contains three URLs | Update documentation alongside future implementation. |
| Backlinks | No usable backlink dataset | Earn relevant mentions through useful examples; no authority-loss diagnosis is supported. |

## Implementation sequence and measurement

### First: establish a baseline

- [ ] Complete the production request checks and Search Console URL inspections.
- [ ] Record 28-day clicks, impressions, click-through rate and average position by page/query/country.
- [ ] Measure mobile Core Web Vitals and test spin/edit/import interactions on a real phone.
- [ ] Verify analytics operation; tags in source do not prove events are collected.

### Next: ship one bounded improvement

- [ ] Add the guide answers, editorial identity and verified support link.
- [ ] Build `/food-wheel/` with readable HTML, safe draft initialization and correct route metadata.
- [ ] Link it from the homepage and guide, then add its canonical URL to the sitemap.
- [ ] Check status codes, initial HTML, rendered metadata and shared-wheel exclusions after deployment.

### Then: evaluate before expanding

- [ ] Compare comparable 28-day periods after indexing, allowing for seasonality and small samples.
- [ ] Track first-spin completion and guide-to-tool clicks without recording names, choices or imported contents.
- [ ] Review search queries and countries before choosing the next landing page or translation.
- [ ] Sample a fixed set of AI-search prompts monthly and record citations, accuracy, model and date.

Example AI prompts: “How can I pick names without repeats?”, “What tool can choose Malaysian lunch options?”, and “Does PickLah upload my wheel draft?” These are future monitoring prompts; this audit did not measure their answers. Google reports AI-feature traffic within overall Web search performance, so Search Console alone does not isolate those visits. [Measurement guidance](https://developers.google.com/search/docs/appearance/ai-features#measuring-the-performance-of-your-site).

Success means more qualified visitors completing a spin, alongside accurate product descriptions and citations. No traffic, revenue or citation increase is promised.

## Evidence and methodology

Source inspection covered `frontend/index.html`, `frontend/public/robots.txt`, `frontend/public/sitemap.xml`, both static public pages, `frontend/src/seo.ts`, `main.tsx`, `App.tsx`, `styles.css`, wheel random/template code, Vite routing, Nginx configuration, deployment workflow, `README.md` and `SEO_SETUP.md`. Source files establish intended behavior, not the deployed version.

Production attempts covered homepage, guide, privacy, robots, sitemap, HTTP/www variants, `/index.html`, an unknown route and a syntactically valid shared route. All local attempts failed DNS resolution; no valid shared snapshot was available for a functional check. The web reader independently failed to access the three public HTML pages.

Public search research used `random name picker wheel without repeats`, `what to eat wheel Malaysian food Picklah`, and `site:picklah.my` on 8 October 2026. Geography was not controlled. Results are qualitative discovery only: they do not establish numerical rankings, zero indexed pages, keyword volume or market size. Competitor examples included [FunRandomizer's name picker](https://funrandomizer.com/random-name-picker) and [Wheel Cue's name picker](https://wheelcue.com/tools/random-name-picker/), whose search excerpts describe no-repeat selection. Competitor full-page reviews were not completed.

Method adapted from the [OpenSEO SEO Audit skill](https://openseo.so/docs/skills/seo-audit). Recommendations were self-reviewed against the inspected code and stated coverage limits. Website implementation and deployment were outside this report-only task.
