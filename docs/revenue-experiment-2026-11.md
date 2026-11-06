# Revenue-path experiment — November 2026

## Baseline (before the change)

Measurement window: October 10–November 6, 2026 for GA4, with matching recent platform checks where available.

- 36 active users and 41 sessions; all recorded sessions were `pinterest / organic_social`.
- 10 quiz starters and 9 completers (90% user completion rate).
- 0 recorded `amazon_affiliate_click` events and 0 recorded `gumroad_click` events in GA4.
- Amazon reported 3 clicks and 0 orders for the recent 30-day report.
- Gumroad reported 0 product views, 0 sales, and $0 revenue for the recent period.
- Pinterest produced 33,311 impressions but only 44 outbound clicks (about 0.13% outbound CTR).

The sample is small. These numbers are a baseline, not a stable conversion-rate estimate.

## Evidence-based hypotheses

### H1 — Visitors cannot choose the right path quickly enough

Pinterest visitors arrive with different intent: style discovery, layout help, or purchase planning. A single long landing page makes all three groups search for their next step.

**Change:** add a three-choice intent router immediately after the hero. Each choice has one promise and one destination.

**Primary metric:** `intent_choice_click` users divided by landing-page users.

### H2 — The strongest commercial choices appear too late

Quiz completion is healthy, but zero commerce clicks were recorded. The result previously required substantial scrolling before presenting a measured plan or the first recommended category.

**Change:** place a two-choice next-step panel directly after the result hero: whole-room planning kit or one result-matched Amazon category. Keep a free-guide alternative for users who are not ready to buy.

**Primary metric:** unique users with `gumroad_click` or `amazon_affiliate_click` at `result_early_choice`, divided by users who see section `result_next_step`.

### H3 — The highest-traffic article needs a commercial action near the answer

The 10×10 layout article was the most-viewed article in the baseline, but its shopping list appeared after several long sections.

**Change:** after the quick answer, offer either a relevant slim-desk comparison or the complete planning kit. The copy explicitly discourages buying the whole room at once.

**Primary metric:** commerce-click users at `article_early_choice`, divided by users who see the article's quick-answer section.

### H4 — Some external-link events are lost during navigation

Amazon showed clicks while GA4 recorded none in an overlapping period. This may include source/date differences, but navigation can also end a normal analytics request before it is sent.

**Change:** send GA4 events with the beacon transport and preserve the original Pinterest attribution on Gumroad links from static articles.

**Validation:** compare weekly GA4 click counts with Amazon/Gumroad destination counts. They need not match exactly, but repeated GA4 zeroes while destination clicks occur should stop.

## Decision rules

Use a 28-day observation window, or wait until at least 30 relevant section viewers when that takes longer. Do not run a split test at the current traffic level; it would be underpowered and would slow learning.

- Keep the landing router if at least 15% of landing users choose a path and downstream engagement does not decline materially.
- Keep the early result panel if at least 10% of viewers click a commercial option, or if it produces the first tracked Gumroad view/order.
- Keep the article panel if it produces at least 3 qualified commerce clicks per 30 viewers.
- Rewrite or reposition a panel if it has at least 30 viewers and zero clicks.
- Do not infer a winning conversion rate from one sale. Record the first sale as proof of mechanism, then continue until the sample is large enough.

## Guardrails

- No ads, paid tools, purchases, or subscriptions.
- Do not show fixed Amazon prices, ratings, or availability.
- Keep affiliate disclosures next to relevant links.
- Judge success by orders and revenue first, then qualified outbound clicks—not impressions alone.
