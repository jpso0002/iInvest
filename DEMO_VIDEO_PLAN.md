# Demo video — shot list

**Audience:** prospective users · **Format:** ~60s, silent, on-screen captions · **Scope:** full app tour

Silent means captions carry the whole message, so every one is short enough to read at a glance — 6 words or fewer where possible. Second person, benefit-led, no jargon. The word "simulator" never appears; "practice money" does.

---

## Before you record

**Viewport: 520 × 1000, light mode.** At ≥480px wide the app renders inside a device bezel (44px radius, dark border) — it self-frames as a phone, so you can crop straight to the bezel with no mockup work. Below 480px it goes full-bleed and you'd have to add a frame yourself.

**Reset between takes.** In the console:

```js
localStorage.clear(); sessionStorage.clear(); location.href = "/";
```

**Two things will differ every take:**

- Prices random-walk every 3 seconds. Portfolio values, % changes and chart shapes will not match between takes. Fine for a cut where no number is held on screen long — but don't inter-cut two takes of the same screen.
- The "This is practice money" dialog fires once per *session* on first opening Simulate. Beat 5 uses it deliberately; if you re-record just that beat, clear `sessionStorage` first or it won't appear.

**Let the lesson path animate.** Scroll it slowly — nodes scale up as they pass the centre and the path pans sideways to follow. It's the most distinctive motion in the app and it's wasted at speed.

---

## The 9 beats

Times are cumulative. Total ~62s; trim beats 7–8 first if you need to hit exactly 60.

### 1 · Hook — 0:00–0:05

- **State:** fresh (cleared).
- **Route:** `/`
- **Action:** hold still on the landing screen. No interaction.
- **On screen:** blue trend logo, "Learn to invest, one bite at a time."
- **Caption:** *Investing, without the jargon.*

### 2 · The path — 0:05–0:13

- **Setup:** you need an onboarded account. Fastest path is to click **Get started** and complete signup + placement once *before* rolling, then start recording from `/lessons`.
- **Route:** `/lessons`
- **Action:** slow scroll down the lesson path, ~3s. Then click the first unlocked node.
- **On screen:** unit card, zig-zag path, nodes scaling and the path panning as you scroll.
- **Caption:** *Bite-sized lessons. One at a time.*

### 3 · Inside a lesson — 0:13–0:22

- **Route:** `/lessons/U1.1`
- **Actions, in order:**
  1. Click **Start lesson**
  2. Hold 1.5s on the concept card (the Work → Money → Goods diagram) — click **Got it**
  3. Hold on the second concept — click **Got it**
  4. On the question, click the **first answer**, then **Check**
- **On screen:** progress bar filling across the top through all four.
- **Caption:** *Learn it. Then prove it.*

### 4 · The reward — 0:22–0:27

- **Action:** let the completion screen land, hold 2.5s. Don't click through immediately — the coach mascot and the two rewards are the payoff.
- **On screen:** "Lesson complete!", **+20 XP**, **+pc$500 practice cash**, coach speech bubble.
- **Caption:** *Finish a lesson, earn practice cash.*
- **Then:** click **Back to lessons**, tap the **wallet icon** (2nd in the tab bar).

### 5 · The promise — 0:27–0:32

- **Action:** the "This is practice money" dialog appears by itself on first open. **Hold on it for a full 2.5s** — this is the single most important frame in the cut for a first-time viewer. Then click **Got it**.
- **On screen:** "Nothing here connects to real markets or a real broker."
- **Caption:** *Fake money. Real skills.*

### 6 · Your portfolio — 0:32–0:38

- **Route:** `/simulate`
- **Action:** hold 2s on the portfolio card, then slow-scroll the asset list past two or three rows. Click **Tidewater Broad Index**.
- **On screen:** portfolio value + sparkline, asset rows with mini charts and green/red change tags, the locked "reach Unit 3" teaser.
- **Caption:** *Practise on eight made-up assets.*

### 7 · Depth on demand — 0:38–0:46

- **State:** this beat is much stronger with ~15 lessons completed, so several detail sections are unlocked. With a fresh account you'll only see the price chart and an empty position card. See "State" below.
- **Route:** `/simulate/TIDE`
- **Action:** hold 2s on the live price (it ticks visibly), tap **1Y** on the timeframe row, then scroll steadily to the bottom past composition bars, market data and the candlestick chart.
- **Caption:** *More unlocks as you learn.*

### 8 · Buy something — 0:46–0:53

- **Action:**
  1. Click **Invest**
  2. Click the **250** quick amount
  3. Hold 1s (fee and preview lines are visible)
  4. Click **Confirm investment**
  5. Hold 2s on the confirmation
- **On screen:** the sheet rising inside the phone, then the green tick and the recap with fees paid.
- **Caption:** *Buy, sell, learn what moves.*

### 9 · The rest, and out — 0:53–1:02

Fast — roughly 3s each, one scroll per tab, no clicks beyond the tab bar.

- **News** (3rd icon): scroll one screen of headlines. *Markets, explained simply.*
- **League** (4th icon): hold on the leaderboard. *Climb the weekly league.*
- **Profile** (5th icon): hold, then **toggle dark mode** — the whole phone flips. *Yours, your way.*
- **Final frame:** return to `/` for the logo and headline, hold 2s.
- **Closing caption:** *iInvest — learn to invest, one bite at a time.*

---

## State you need

Beat 7 is the one that fails on a fresh account. Everything else works from a clean signup.

Recording in one continuous session and just *doing* 15 lessons is not realistic. Two options:

1. **Record beats 1–6 and 8–9 on a fresh account**, then separately set progress before beat 7. Cleanest, and the cut hides the join.
2. **Ask me for seed fixtures** — ready-made `localStorage` snapshots so every take starts identical. I didn't build them since you only asked for the shot list, but given prices drift and orders fill on timing, they'd make re-takes reproducible. Say the word.

---

## What I left out, and why

- **Resting orders** (limit buys, stop-loss firing with its toast). Visually the best moment in the app — a stop-loss gapping through its trigger is genuinely dramatic — but it needs 26+ lessons to unlock, takes ~10s of waiting for a fill, and can't be explained in a 6-word caption. It belongs in a longer cut, not this one.
- **Transaction history.** Real screen, but it's a list; it doesn't sell anything in 3 seconds.
- **Onboarding and the placement quiz.** Signing up is not a feature. Start the story at the lessons path.

## One honest note on scope

Five tabs in 60 silent seconds gives News and League about 3 seconds each — one scroll, no interaction. Those are also the two thinnest areas: League ranks you against generated bots rather than real users, and News is fixed content. They're in beat 9 mostly to show the app has breadth.

If the goal is conversion rather than coverage, cutting beat 9 down to just the dark-mode flip and giving those 6 seconds to beats 7–8 would make a noticeably stronger video. Your call — the plan above does what you asked for.
