# iInvest — guided vertical slice: implementation plan

**Status:** proposal. No code changed. Awaiting approval.

**Goal:** a ~7 minute guided experience that makes someone understand what iInvest is, why it's different, why lessons exist, and how learning immediately improves investing — with the app leading almost every interaction.

---

## 0. One thing to resolve first

**No Unit 1 curriculum was attached to your message**, and nothing new landed in the repo (`git status` is clean; working tree matches `195ab61e`). I've planned against the **Unit 1 already in `src/content/lessons.ts`**, which I read in full:

| Lesson | Title | Steps |
|---|---|---|
| U1.1 | What is money, and why save? | 2 concepts (flow, stack) + 3 MCQ |
| U1.2 | The budget | 2 concepts (flow, pie) + 3 MCQ |
| U1.3 | Emergency savings | 2 concepts (bars, flow) + 3 MCQ |
| U1.4 | Compound interest | 2 concepts (formula, bars) + 3 MCQ |
| U1.5 | Setting a savings goal | 2 concepts (formula, flow) + 3 MCQ |

If your attached version differs, **§3 (the beat sheet) and §7 (content edits) are the parts that change**; the architecture in §4–§6 and §8 holds either way. Send it and I'll re-cut those two sections.

I also found one substantive problem with using this Unit 1 as-is — see §8.1. It needs a decision from you.

---

## 1. Audit of the current application

### What exists and works

| System | File(s) | State |
|---|---|---|
| Curriculum engine | `content/lessons.ts`, `_app.lessons.$lessonId.tsx` | 29 lessons, 6 units. Concept + MCQ steps, inline diagrams, intro → steps → completion. Solid. |
| Lesson path | `components/lessons/LessonPath.tsx` (573 lines) | Zig-zag path, scroll-driven scale/pan, node states, unit tabs, "Start" badge. The most distinctive screen. |
| Progression | `lib/xp.ts`, `store/useAppStore.ts` | XP, streak, practice cash, unit-up bonus, `pendingLessonComplete` transient. |
| Progressive disclosure | `lib/disclosure.ts` | 10 asset tiers + 6 invest tiers, gated on completed-lesson count. **The product's core mechanic.** |
| Simulator | `_app.simulate.index.tsx`, `_app.simulate.$assetId.tsx` | 8 assets, portfolio, 10-tier detail screen. |
| Market engine | `lib/market.ts`, store `tick()` | Seeded random walk, 3s tick, deterministic history generators. |
| Trading | `lib/trading.ts`, store | Amount-based buy, fees, slippage, resting limit/stop/target orders with a fill engine. 28 tests. |
| Celebrations | `CompletionScreen`, `LevelUpCelebration`, `animate-node-pop`, `animate-check-pulse`, confetti | Already good. Underused. |
| Coach | `components/Mascot.jsx` | Avatar + speech bubble, `inline` / `floating` variants. **Used in exactly one place** (completion screen). |
| Design system | `theme.css` / `styles.css` | Two-tier tokens, just refactored. Reusable as-is. |
| Demo seeding | `lib/demo.ts` | `?demo` writes a snapshot to localStorage and reloads. Direct precedent for how the slice boots. |

### What's thin or in the way

- **The coach is decorative.** One usage, no persistence, dismisses itself, no queue, no positioning. It must become the narrator.
- **Navigation is wide open.** `TabBar` exposes 5 tabs; only Simulate is gated (`simulateTabUnlocked`). Nothing stops a user wandering to News/League/Profile mid-tutorial.
- **Nothing sequences across screens.** `pendingLessonComplete` is the only cross-screen signal and it's single-purpose.
- **The market is unauthored.** Seeded and deterministic-per-reload, but not *scripted* — you cannot guarantee "the price dips 4% now" for a teaching beat.
- **Onboarding is a dead weight for a slice.** Signup + a 7-question placement quiz before anything happens. Directly contradicts "interesting events happen immediately".
- **Two screens are thin content.** League ranks against 6 generated bots; News is 8 static articles.

---

## 2. The shape of the slice

Not a sandbox with hints bolted on. A **director** owns the session and the app renders what the director permits.

```
TutorialDirector  (script cursor + gate evaluation)
        │
        ├── decides which route is legal          → RouteGuard
        ├── decides which tab is enabled          → TabBar (existing, extended)
        ├── decides which disclosure tiers apply  → SliceDisclosure (overrides lib/disclosure)
        ├── drives the market                     → ScriptedMarketDriver (overrides tick)
        └── renders guidance                      → CoachLayer / Spotlight / Pointer
```

**Everything the director does is additive and toggleable.** The slice runs at `/?slice`. Without that flag the app behaves exactly as it does today — production code paths stay intact, tests keep passing.

---

## 3. Beat sheet (~7 min)

Each beat: what the app does → what the user does → what it unlocks. The user is never asked to decide *what* to do, only to *do* it.

**Act 0 — Cold open (0:00–0:40).** No signup, no placement quiz. Coach appears over a pre-populated portfolio: *"That's pc$1,000 of practice money. Not real. Let's turn it into something."* Portfolio ticks visibly. **Hook first, explanation second.**

**Act 1 — Why lessons exist (0:40–1:30).** User taps the only enabled thing: an asset. Detail screen opens showing **price and chart only**, with four visible locked placeholders. Coach: *"You can see the price. You can't see whether it's a good price. Each lesson turns one of these on."* — This is the moment the product's premise lands, and it lands *before* the first lesson.

**Act 2 — First lesson → first unlock (1:30–3:00).** Spotlight drives to U1.1. Lesson runs (existing engine). Completion screen fires with XP + pc$500. Return to the asset — **"Your position" tier visibly unlocks with an animation.** Coach: *"That's one. Four to go."*

**Act 3 — Learning changes a decision (3:00–4:30).** U1.2 (budget) → unlocks fees & balance in the buy sheet. Guided buy: coach points at the fee line the user couldn't see 90 seconds ago. *"That's pc$1.25 you'd have missed."* Purchase confirmation celebrates.

**Act 4 — The market moves against you (4:30–5:45).** **Scripted dip.** Position goes red. Coach: *"This is the bit that makes people panic-sell."* → U1.3 (emergency savings / "before investing") → unlocks timeframes + 52-week range → user switches to 1Y and sees the dip in context. *"Same asset. Different story."* **This is the single strongest beat** — a feature unlocked by a lesson immediately reframes a loss.

**Act 5 — The payoff (5:45–7:00).** U1.4 (compound interest) → unlocks a **time-lapse**: the scripted market fast-forwards 12 months in ~8 seconds, portfolio compounds visibly. U1.5 (savings goal) → set a target; goal ring appears on the portfolio card. Final coach card ties it together, then a summary screen: *lessons completed, features unlocked, portfolio grown.*

**Why this order:** every lesson is *motivated by a problem the user just hit*, never delivered cold. That's the difference between a tutorial and a manual.

---

## 4. Systems reused as-is

No changes needed:

- **Lesson engine** — `_app.lessons.$lessonId.tsx`, concept/MCQ rendering, `LessonVisual` diagrams, progress bar.
- **`LessonPath`** — including the scroll-driven scale/pan. Only *filtered* to Unit 1 via props.
- **Store & trading** — `buyWithAmount`, `sell`, `placeOrder`, fill engine, fees, slippage. Untouched; the 28 tests stay green.
- **Celebrations** — `CompletionScreen`, `LevelUpCelebration`, confetti, `animate-node-pop`, `animate-check-pulse`.
- **Design tokens** — the whole two-tier system, incl. `--reward-*` for unlock moments and `--warning-*` for the scripted dip.
- **Detail screen sections** — all ten render as-is; only *which* are unlocked changes.
- **`Sheet` / `Dialog`** + `phoneFrameContainer()` portal targeting.
- **`lib/demo.ts` seeding pattern** — the slice boots the same way.

Reused with **light extension**:

- **`Mascot`** — needs `id`, controlled visibility, anchor position, and a "continue" affordance. Same art, same bubble.
- **`TabBar`** — currently one boolean gate; becomes a per-tab enabled set from the director.
- **`disclosure.ts`** — keep the module and its API; add a slice threshold table (see §8.1).

---

## 5. Systems hidden or bypassed

| System | Treatment | Why |
|---|---|---|
| Signup / login routes | Bypassed — slice seeds an onboarded profile | Signing up is not a feature. Costs 30s of a 7-min budget. |
| Placement quiz | Hidden | 7 questions before any payoff. Fatal to "interesting events immediately". |
| Units 2–6 | Hidden from the path | Slice is Unit 1. Unit tabs render Unit 1 only. |
| News tab | Disabled (visible, locked) | Static content, no reinforcement of the core loop. |
| League tab | Disabled until Act 5, then a single celebratory glance | Bot-generated; showing it early invites "are these real people?" |
| Profile tab | Disabled | Settings mid-tutorial is pure leak. |
| Transaction history | Disabled | Redundant with the confirmation screen at this length. |
| 5 of 8 assets | Hidden | Choice paralysis. Slice uses ~2 assets with authored behaviour. |
| Limit / stop / take-profit | Out of scope | Needs 26+ lessons of context. Doesn't fit a Unit 1 slice. |
| Free navigation | Route-guarded | ~90% guided means the director owns the route. |

**Visible-but-locked beats hidden** wherever the lock *teaches* something. A greyed News tab says "there's more here". A missing one says nothing. Locked *disclosure tiers* are the point of the product and must stay visible.

---

## 6. New systems required

### 6.1 `lib/slice/script.ts` — the tutorial script (data)
Declarative beat list. Each beat: `id`, `route`, coach copy, guidance target (element key), advance condition (`tap` / `route-enter` / `lesson-complete` / `predicate` / `timer`), unlocks granted, market cue. Data, not code — the whole experience is editable in one file.

### 6.2 `store/useSliceStore.ts` — the director (state)
Separate Zustand store, **session-only, never persisted**, keyed off the script cursor. Exposes `currentBeat`, `advance()`, `isRouteAllowed()`, `isTabEnabled()`, `sliceUnlocks`. Separate store so it cannot corrupt `useAppStore` or force a `STORAGE_VERSION` bump.

### 6.3 `components/slice/Spotlight.tsx`
Full-frame scrim with a cut-out around a target element. Blocks interaction outside the cut-out. Measures via `getBoundingClientRect`, follows scroll/resize via `ResizeObserver` + rAF. **Renders into `.phone-frame`** (same containing block the sheets use).

### 6.4 `components/slice/CoachCard.tsx`
The narrator. Anchored (top/bottom/near-target), queued, one at a time, explicit "Got it" advance. Wraps the existing `Mascot` art. Never auto-dismisses — the user sets the pace.

### 6.5 `components/slice/Pointer.tsx`
Animated arrow / pulsing ring for the tap target. `prefers-reduced-motion` → static ring.

### 6.6 `components/slice/UnlockBurst.tsx`
The "earned it" moment. A locked placeholder animates into its real section: ring flash, gold particles (`--reward-gold`), section slides in. **This is the emotional core** — it must feel like a reward, not a state change.

### 6.7 `lib/slice/marketScript.ts` — scripted market driver
Replaces the random walk *during the slice only*. A keyframed price track per asset (`[{ atBeat, price }]`) interpolated over real time, plus a `fastForward(months)` for the compounding time-lapse. Guarantees the dip lands exactly when the script needs it.

### 6.8 `components/slice/RouteGuard.tsx`
Redirects any route the current beat disallows. Prevents back-button and deep-link escape.

### 6.9 `routes/_slice.summary.tsx`
Closing screen: lessons completed, features unlocked (with icons), portfolio before/after. The "here's what just happened" that makes the pitch land.

### 6.10 `lib/slice/disclosure.ts`
Slice-specific threshold table — see §8.1.

---

## 7. Content edits needed

Unit 1 is written for *saving*, not investing. Three targeted additions (no rewrites):

1. **U1.3** — extend the existing "Before investing" concept with one line explicitly handing off to the simulator.
2. **U1.4** — the compound-interest `formula` and `bars` visuals already exist; add one concept beat that names the time-lapse the user is about to see.
3. **A short bridging coach script** between each lesson and its unlock. Copy lives in the script file, not the curriculum — the curriculum stays production-valid.

---

## 8. Architectural concerns — read before approving

### 8.1 🔴 The disclosure thresholds break the core promise (needs your decision)

This is the most important finding. Current thresholds vs what Unit 1 can actually reach:

| Tier | Unlocks at | Reached by finishing all of Unit 1 (5 lessons)? |
|---|---|---|
| Price & chart | 0 | ✅ |
| Your position | 1 | ✅ |
| Timeframes & 52-week range | **9** | ❌ |
| Avg price & fees | **13** | ❌ |
| Fund composition | **14** | ❌ |
| Market data / ATH / order book | 19–25 | ❌ |

**Completing the entire Unit 1 currently unlocks exactly one new section.** A slice built on it would demonstrate the *opposite* of "learning immediately improves investing".

Options:

- **(A) Slice-local threshold table** — `lib/slice/disclosure.ts` remaps tiers to 1-per-lesson for the slice only. Production table untouched. **My recommendation.** Cheapest, zero risk to the real app, and the slice is a pitch artefact, not the product.
- **(B) Rebalance production thresholds** — honest but changes the real product's pacing on the basis of a demo.
- **(C) Slice spans Units 1–3** — truest to the product, but ~15 lessons is far beyond 10 minutes.

I recommend **(A)** and have planned around it. It needs your explicit approval because it means *the slice's pacing is not the product's pacing* — worth knowing if you're demoing to someone who'll later use the real app.

### 8.2 🟠 Spotlight positioning is genuinely fiddly here
I've already hit this twice in this codebase: the phone frame is `position: relative` with `transform`, sheets portal into `.phone-frame`, and the lesson path has its own scroll container with rAF-driven transforms. A naive `getBoundingClientRect` spotlight will drift. Mitigation: spotlight renders inside `.phone-frame`, subscribes to the same scroll container, recomputes on rAF, and every target is a stable `data-slice-target="…"` attribute rather than a CSS selector.

### 8.3 🟠 Scripted market vs. the tested engine
The fill engine has 28 tests asserting behaviour of the random-walk `tick()`. The scripted driver must **wrap, not replace**: same `tick()` contract, different price source, injected only when the slice is active. Otherwise I risk breaking tested trading behaviour for a demo feature.

### 8.4 🟡 Two sources of truth for "what's unlocked"
Production disclosure and slice disclosure could disagree. Mitigation: one accessor (`useDisclosure()`) that returns the slice table when the slice is active and the production table otherwise. Components never branch on "am I in a slice".

### 8.5 🟡 Reduced motion
The slice leans on motion (spotlight, pointer, unlock burst, time-lapse). All must degrade: pointer → static ring, burst → instant reveal, time-lapse → jump with a summary. The codebase already has `usePrefersReducedMotion` and a global CSS override; the slice must honour both. The time-lapse is the risky one — it's *informational* motion, so under reduced motion it needs a static before/after rather than nothing.

### 8.6 🟡 Escape hatches
Deep links, browser back, and the PWA `start_url` can all drop a user mid-script. `RouteGuard` handles redirect; the director needs to resume at the correct beat rather than restart.

### 8.7 🟢 Persistence
Slice state is session-only. A relaunch restarts the slice cleanly — which is what you want on a demo phone. No `STORAGE_VERSION` bump.

### 8.8 🟢 The production app stays intact
`?slice` is opt-in. Nothing above deletes a production route or component. `?demo` and the current default flow keep working.

---

## 9. Proposed build order

1. Director store + script data + `RouteGuard` — sequencing works, no visuals
2. `CoachCard` + `Pointer` + `Spotlight` — guidance layer
3. Slice disclosure table + `UnlockBurst` — the earned-unlock moment
4. Slice seed state + navigation lockdown
5. Scripted market driver + the dip and time-lapse beats
6. Summary screen + copy pass
7. Full-run verification, light and dark, reduced motion, on the phone

Steps 1–3 are the risky ones; after those the rest is assembly. I'd suggest reviewing after step 3.

---

## 10. What I need from you

1. **The Unit 1 curriculum** you meant to attach (or confirmation to use the in-repo one).
2. **A decision on §8.1** — I recommend option (A), slice-local thresholds.
3. **Confirmation on the beat sheet in §3** — particularly Act 4 (the scripted dip), which is the strongest beat but also the most work.
4. **Should the slice replace `?demo`** or sit alongside it?
