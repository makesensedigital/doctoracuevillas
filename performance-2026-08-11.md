# Lighthouse remediation — 2026-08-11

## Scope and evidence

The baseline is the public PageSpeed Insights laboratory report supplied for
`https://doctoracuevillas.com/` on 2026-08-11. The after measurement is Lighthouse CLI against the
local static server on the same date. It is useful for regression and target validation, but it is
not a replacement for a post-deployment PageSpeed Insights run: the public URL still serves the
previous revision.

## Results

| Metric | Public PSI before, mobile | Local Lighthouse after, mobile | Target |
|---|---:|---:|---:|
| Performance | 75 | 99 | >= 90 |
| FCP | 3.3 s | 1.1 s | <= 1.8 s |
| LCP | 4.5 s | 1.9 s | <= 2.5 s |
| TBT | 50 ms | 70 ms | — |
| CLS | 0 | 0 | no regression |
| Speed Index | 4.8 s | 1.1 s | <= 3.4 s |
| Accessibility | 100 | 100 | 100 |
| Best Practices | 100 | 100 | 100 |
| SEO | 100 | 100 | 100 |

| Metric | Public PSI before, desktop | Local Lighthouse after, desktop | Target |
|---|---:|---:|---:|
| Performance | 96 | 100 | >= 96 |
| FCP | 0.2 s | 0.3 s | maintain |
| LCP | 0.8 s | 0.4 s | maintain |
| TBT | 160 ms | 10 ms | < 100 ms |
| CLS | 0.003 | 0 | no regression |
| Speed Index | 0.6 s | 0.3 s | maintain |
| Accessibility | 100 | 100 | 100 |
| Best Practices | 100 | 100 | 100 |
| SEO | 100 | 100 | 100 |

Agentic navigation must be re-run against the deployed `/llms.txt`; the generated file now has one
H1 and eleven explicit Markdown links, including identity, services, booking, locations and privacy.

## Changes by file

| Files | Change | Expected impact |
|---|---|---|
| All nine HTML documents | Add `defer` to `config.js`, `analytics.js`, `facts.js` and `site.js`, preserving dependency order. | Removes 17.8 KiB of first-party JavaScript from the parser-blocking path. Primary FCP/LCP improvement. |
| `analytics.js` | Queue GTM and Clarity loading until after `load`, then run it in idle time. Events emitted before GTM arrives remain in `dataLayer`. | Moves about 280 KiB and the reported 169 ms of third-party main-thread work out of initial rendering. Primary desktop TBT improvement. |
| `measurement.md` | Record the delayed-loading contract and the immediate-click verification procedure. | Prevents an unverified analytics regression after deployment. |
| `styles.css` | Change all self-hosted faces from `font-display: swap` to `optional`; retain the two hero font preloads and intrinsic image dimensions. | Prevents a late font swap from re-triggering the text LCP and avoids font-driven CLS. |
| `scripts/build-derived.mjs`, `llms.txt` | Generate descriptive Markdown links instead of bare URLs and add the key editorial pages. | Addresses the reported “file contains no links” agentic-navigation failure. |

## Commits

- `Make llms navigation explicit` — agentic navigation (`llms.txt`).
- `Defer first-party scripts` — parser-blocking first-party scripts.
- `Load third-party tags after paint` — third-party analytics loading.
- `Keep late fonts off the LCP path` — text LCP font policy.

## Validation

- `node scripts/test-gate.mjs`: 27 negative fixtures and 5 clean-run assertions, 0 failures.
- `check-config`, derived-artifact check, markup check and asset check: 0 failures.
- Editor diagnostics for the changed CSS and JavaScript: none.
- Local Lighthouse mobile: 99 performance, 100 accessibility, 100 best practices, 100 SEO.
- Local Lighthouse desktop: 100 in all four categories.
- Remaining measured opportunities have zero time savings: unused third-party JavaScript 125.1 KiB
  mobile / 117.7 KiB desktop, unminified first-party JavaScript 5.8 KiB, and CSS 3.6 KiB.

## The deployed measurement, 2026-09-21

The measurement this document left open for six weeks. **It is Lighthouse CLI 12.8.2 run from a
developer machine against `https://doctoracuevillas.com/`, not PageSpeed Insights**, and the
difference is worth stating rather than glossing: PSI runs on Google's own infrastructure and, where
a site has enough traffic, shows **CrUX field data** beside the lab run. This has neither. It is a
lab measurement of the real deployed revision — which is precisely what was missing, since the
2026-08-11 "after" column was a local server serving a revision the public URL did not yet have.

| Metric | Mobile | Desktop | Target |
|---|---:|---:|---:|
| Performance | **100** | **100** | >= 90 mobile / >= 96 desktop |
| Accessibility | 100 | 100 | 100 |
| Best Practices | 100 | 100 | 100 |
| SEO | 100 | 100 | 100 |
| FCP | 1.1 s | 0.3 s | <= 1.8 s |
| LCP | 1.6 s | 0.4 s | <= 2.5 s |
| TBT | 30 ms | 0 ms | < 100 ms |
| CLS | 0 | 0 | no regression |
| Speed Index | 1.1 s | 0.3 s | <= 3.4 s |

Every target is met, and mobile performance is a point above the local-after reading of 99.

**The opportunities that remain are the ones this document already rejected, and they have not
changed shape.** Recording them so the next run is not re-investigated:

| Audit | Mobile | Desktop | Why it is still open |
|---|---:|---:|---|
| `uses-long-cache-ttl` | 10 resources | 10 resources | **The host.** GitHub Pages ignores `_headers`, so everything is served at `max-age=600` and the one-year immutable policy for `/assets/*` cannot be applied. This audit is the clearest measured evidence for the hosting argument in `_headers` and `brief.md` |
| `unused-javascript` / `cache-insight` | 131 KiB | 130 KiB | Third-party — the tag container and what it loads. Not first-party code, and it is requested only after `load` |
| `uses-responsive-images` | 7 KiB | 15 KiB | No image codec is installed; adding one needs approval. The saving is small enough that no binary was regenerated to chase it |
| `unminified-css` | 4 KiB | 4 KiB | First-party, and minifying it adds a build step to a site that deliberately has none |
| `legacy-javascript` | — | — | Third-party |

Note `interactive` reads 4.0 s on mobile while TBT is 30 ms. That pair is the deferred third-party
arriving during idle time after the page is already usable — the loading policy working as designed,
not a regression.

## Pending, rejected and risks

- ~~**Public after measurement:** pending deployment.~~ **MEASURED 2026-09-21 against the deployed
  site — see the section below. Every target is met on both form factors.**
- **Cache headers:** GitHub Pages ignores `_headers`; one-year immutable caching and short HTML TTLs
  cannot be implemented on the current host. Changing host is an explicit owner decision.
- **Content-hashed assets and Brotli:** implementing these changes the publication pipeline and gate.
  Repository rules require approval before that change. The current `?v=7` invalidation is not a
  content-addressed filename and therefore does not satisfy the immutable-cache recommendation.
- **Responsive portrait / AVIF:** no image codec is installed and adding one requires approval. The
  after audit reports no image-delivery savings, so no binary was regenerated merely to satisfy the
  earlier estimate. Existing `width` and `height` remain unchanged, preserving CLS.
- **Critical CSS:** the after audit reports no render-blocking time saving and all mobile timing
  targets pass. Inlining CSS would duplicate it across nine revalidated HTML documents; it was not
  adopted without evidence of a remaining timing benefit.
- **Analytics:** local validation confirms that GTM still loads after the page load. Production GTM
  Preview must verify an immediate click is replayed from `dataLayer`, consent remains denied by
  default, and only the single configured container is active.
- **Comparability:** public PSI and local Lighthouse differ in network, server cache and run variance.
  Treat the table as target validation, not a causal before/after claim, until the deployed PSI run.
