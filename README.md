# Portfolio v3 — What's New

Built on top of v2, with the concepts you flagged from the reference site —
recreated from scratch with your real content, not copied.

## New in this version

1. **Loading intro** — name + progress percentage animates 0→100% before the
   site reveals itself. Skips instantly if the browser has reduced-motion on.
2. **"My Techstack" orbit section** — a new section below Skills where tech
   chips (Python, FastAPI, RAG, Next.js, PostgreSQL, Qdrant, React, Node.js)
   drift in independent elliptical orbits around a center mark. Hover any
   ring to pause it.
3. **Category skill cards** — Skills is now four cards (Full Stack Dev,
   AI & LLM, Data & Infra, Tools & Workflow), each with an icon, a real
   description of what you actually do in that area, and its tag pills —
   instead of one flat tag cloud.
4. **Animated career timeline** — vertical line with year markers for 2023
   (started your CS degree) through 2026 (AIKSOL internship) to now. Only
   real entries — I didn't invent extra jobs the way the reference site did.
5. **Scroll-stacking project cards** — each project now sits in a browser-
   chrome-style card (colored dots + a fake address bar) that sticks in
   place as you scroll, so the next project's card slides up and stacks on
   top of it.

## A layout note (read before you deploy)

The reference site you sent had text overlapping itself on desktop (the name
crossing into the tech-stack circle, timeline text overlapping). I rebuilt
the equivalent sections — timeline, orbit chips, sticky cards — with fixed
spacing and z-index ordering specifically to avoid that. Test it at a few
browser widths after deploying, since sticky-stacking is the one part that's
genuinely sensitive to viewport height (very short/wide laptop windows may
need the `top: calc(84px + var(--i,0) * 16px)` value in `.project-panel`
nudged in `styles.css` if a card ever visually overlaps the nav).

On mobile, the sticky-stacking effect is intentionally turned off (cards
just stack normally in flow) and the orbit field is scaled down — same
reasoning as v2: no overhead, no merged text, matches what you said was
already working well on phone.

## Files
Same structure as v2 — `index.html`, `styles.css`, `script.js`,
`assets/profile.png`. Deployment and Formspree setup instructions are the
same as before (see the earlier README, or just ask me again).
