# Growth reform — November 7, 2026

## Why this reform exists

The recent baseline showed a healthy quiz completion rate but weak movement from the site to a revenue destination. The working diagnosis is not “the quiz is broken.” It is that the project needs more qualified reasons to visit, more original utility after the click, and a clearer bridge from a room constraint to one commercial action.

This release deliberately avoids ads, paid tools, email collection, fake urgency, fabricated reviews, and fixed Amazon data.

## Evidence used

- [Pinterest creative best practices](https://business.pinterest.com/creative-best-practices/) recommends mobile-first 2:3 creative, concise messaging, visible branding, specific calls to action, and a complete visual story.
- [Rowico Home’s Pinterest case study](https://business.pinterest.com/hi/success-stories/rowico-home/) attributes stronger click performance to refreshed creative with clear imagery, text overlays, and calls to action. It is a paid case and does not guarantee organic results; the transferable lesson is message clarity and full-funnel continuity.
- [Swoon’s Pinterest case study](https://business.pinterest.com/en-in/success-stories/swoon/) used Pinterest trend/search evidence to reshape home-decor creative. The transferable lesson is to build around an observed planning job, not generic inspiration.
- [Google’s people-first content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) explicitly recognizes functional calculators and tools as main content and emphasizes original effort, accuracy, authorship, and process transparency.
- [Google’s ecommerce site-structure guidance](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure) explains that internal links help communicate the relative importance and relationship of pages.
- [Baymard product-page research](https://baymard.com/research-articles/current-state-ecommerce-product-page-ux) reports that users actively look for return information and other purchase conditions. This project cannot control Amazon’s policies, so it moves verification prompts next to affiliate links instead of copying volatile data.

## New experiments in this release

1. **Free furniture fit checker** — creates an original, repeatable reason to visit beyond a style quiz.
2. **Two-orientation screening** — tests the room in both directions instead of assuming one layout.
3. **Three-level fit verdict** — distinguishes a 30-inch target, 24–29-inch compromise, and under-24-inch replan signal.
4. **Constraint selector** — workspace, storage, or lighting changes the recommendation.
5. **Budget-path selector** — $50, $100, and $200 paths change the buy order without pretending to know current product prices.
6. **Personalized three-step buy order** — converts measurements into a sequence, not a product dump.
7. **Conditional Amazon category** — the affiliate search follows the stated constraint and keeps the affiliate tag visible in code.
8. **Matching free guide** — every tool result retains a non-commercial next step.
9. **Shareable result URL** — saves non-personal room inputs in the URL with no account or server storage.
10. **Printable plan** — creates offline utility and a reason to return.
11. **Tool-to-kit gap explanation** — sells the paid kit only when the free screening tool no longer solves the full planning job.
12. **Result-page priority switcher** — quiz users can change the first Amazon recommendation based on the room’s actual gap.
13. **Homepage tool module** — gives Pinterest and Google visitors a second high-intent path immediately on the main site.
14. **Public editorial method page** — explains authorship limits, measurement rules, affiliate independence, image/AI usage, and corrections.
15. **Structured-data expansion** — adds WebSite, WebApplication, AboutPage, updated Article authorship, and current modification dates.
16. **Internal-link reform** — connects the homepage, tool, article, method page, quiz, and free guides in both directions.
17. **New behavioral events** — measures tool start, completion, fit level, priority, budget path, saved result, result-priority selection, and downstream clicks.

## Hypotheses and proof rules

### H1 — Original utility increases qualified visits

**Prediction:** Pins and search pages promising a “fit check” will produce a higher outbound-click rate and more engaged sessions than generic style inspiration.

**Test:** publish at least six materially different 2:3 Pins for the tool: question, before/after math, warning, two-orientation comparison, budget path, and “do not buy yet.” Give each a unique `utm_content`.

**Keep if:** after at least 3,000 combined impressions, tool Pins exceed the account’s 0.13% recent outbound CTR baseline and at least 40% of tool sessions complete a calculation.

### H2 — Constraint-based personalization creates more qualified commerce clicks

**Prediction:** asking “what is missing most?” before an Amazon CTA produces more clicks than a fixed first item because the recommendation explains its job.

**Keep if:** at least 10% of users who view the result next-step section select a priority and at least 5% click a resulting category after 30 viewers.

### H3 — The fit checker reduces premature shopping but improves downstream quality

**Prediction:** “replan” users may click Amazon less, but users who do click will have a clearer dimension target. The business should optimize for orders and useful clicks, not raw outbound volume.

**Keep if:** the tool produces at least three Amazon clicks or one order per 100 completed checks, with no misleading fixed price or availability claims.

### H4 — A visible method improves trust and search quality

**Prediction:** explaining who, how, limitations, affiliate policy, and corrections will support user trust and Google’s people-first quality signals.

**Keep if:** method-page visits are followed by a tool, guide, quiz, or paid-link action in at least 10% of sessions after 30 page views. Search effects need a longer observation window and are not attributed to one release alone.

### H5 — The free tool clarifies the paid product’s job

**Prediction:** a user who finishes a screening calculation better understands why a reusable layout and budget workbook is different from a free answer.

**Keep if:** `gumroad_click` at `fit_checker_result` reaches 3% of completed checks or produces the first verified Gumroad product view/sale.

## Measurement discipline

- Use 28 days or at least 30 exposed users per surface, whichever takes longer.
- Do not call a winner from one sale.
- Compare platform source-of-truth counts: Pinterest for Pin clicks, GA4 for on-site behavior, Amazon for affiliate clicks/orders, and Gumroad for product views/sales.
- Never interpret impression growth as profit without downstream evidence.
- Rewrite or remove an experiment after 30 qualified exposures and zero target actions, unless it has clear non-commercial user value.
