# American Rails — Board Research

Research for a faithful digital re-creation of the physical board of **American Rails**
(Tim Harrison, art by Alexandre Roche, Quined Games, 2013).
BGG entry: <https://boardgamegeek.com/boardgame/141314/american-rails> (Master Print edition).

**How to read this document.** Every fact is tagged with a confidence level and a source.
Anything below **HIGH** should be checked against your physical board before you hard-code it.

- **HIGH** — stated in the official rulebook, or printed unambiguously in the board legend.
- **MEDIUM** — read off the board art or a rules example; plausible but the image was low-res.
- **LOW** — my best guess from a blurry image; treat as a placeholder only.

---

## Confidence & gaps — what still needs the physical board

These are the items you MUST confirm from photos of your own board. I could not get a
high-resolution board scan (BoardGameGeek blocks automated downloads, and the only clean
board image I could retrieve is an ~800 px retailer photo where city text is barely legible).

1. **The full city list and every city's two income values.** I have a handful confirmed and a
   larger set at LOW confidence (see the city table). **Photograph each city hex and read the
   two numbers (`full / shared`) directly.** This is the single biggest gap.
2. **Chicago's printed income value.** Chicago is confirmed as a non-developable hub and a
   special-connection city, but I could not read its two numbers off the image.
3. **Boston's and Baltimore's income values.** Confirmed as non-developable hubs; values unread.
4. **Exact terrain type of every individual hex.** I can describe the *regions* (see Terrain) with
   MEDIUM confidence, but a per-hex map needs a clear board photo.
5. **The exact hex-grid dimensions (columns × rows) and precise adjacency.** I can describe the
   grid style with MEDIUM confidence but not give you exact coordinates.
6. **The income-track numbering range** (it wraps the board edge; I could read ~20 up to ~70, and
   setup starts companies at 0 — so 0–70+ — but confirm the min/max printed).

Items I consider **settled (HIGH confidence)** and that you can build against now:
the action-track order, the four terrain types and their costs, which five cities are
non-developable hubs, which three cities give the $10 connection bonus, and the city-income /
dividend rules.

---

## Sources

| Source | What it gave | Reliability |
|---|---|---|
| **Official English rulebook (PDF)** — <https://quined.nl/wp-content/uploads/2017/02/AMERICANRAILS_RULES_ENG_3.pdf> | All rules text: terrain costs, hub cities, connection bonuses, income & dividend rules, action definitions, the New York `8/5` legend, the Buffalo `4/3` example | **Primary / authoritative** |
| **Board art photo** — <https://www.planetongames.com/8957-large_default/american-rails.jpg> (~800 px) | Action-track icon order, terrain-region layout, terrain legend, partial city values | Genuine board art, but low resolution |
| Quined product page — <https://www.quined.nl/featured_item/american-rails-2/> | Component list, links to rulebooks in 4 languages | Publisher (reliable) |
| UltraBoardGames rules — <https://www.ultraboardgames.com/american-rails/game-rules.php> | Mirror of the rulebook text | Reliable (matches official) |
| BGG game page — <https://boardgamegeek.com/boardgame/141314/american-rails> | (Blocked from automated fetch — Cloudflare 403. Has the best user board scans if you open it in a browser.) | Not machine-accessible |

> Tip for you, Ben: for the best board scans, open the BGG page above in your browser and click
> the **Images** tab. Those are higher-resolution than anything I could pull automatically, and
> would let you confirm every city value at a glance.

---

## 1. Board overview (HIGH)

- One game board covering the **United States east of the Mississippi River**.
- Around the outer edge runs the **company income track** (numbers wrapping the border; I could
  read roughly 20→70 across the top and down the sides). Each of the up-to-six companies has a
  cube on this track; companies start at **0** at setup.
- The interior is a **hex grid** of terrain and city hexes.
- Bottom edge: a **year track** with spaces **1851 · 1852 · 1853 · 1854 · 1855 · 1856 · 1857**
  (the game lasts up to seven rounds). A black train marker starts on **1851**.
- Right side: the **Turn Order track** (a column of numbered circles, 1–5) next to the
  **Action Track** (a 3-column grid — one column per action phase — with 7 action rows).
- Bottom strip: the six company **treasury/supply** areas
  (American, National, Continental, Majestic, Liberty, Republic).
- A small **terrain-cost legend** and a **"City Hex" legend** are printed on the board face.

---

## 2. The Action Track (HIGH confidence on order and set)

Read directly from the board art. The panel is a grid: the **Turn Order track** is a single column
of numbered circles **1–5** (up to five players). To its right is the **Action Track**, which has
**3 identical columns** (one used per action phase in a round) and **7 rows**, one row per action.

**The 7 actions, in printed order from top to bottom:**

| # (top→bottom) | Action | Board icon | Effect (from rulebook) |
|---|---|---|---|
| 1 | **Pass** | right-arrow | Do nothing. (Passing tends to make you first to choose next phase.) |
| 2 | **Develop** | black house / development marker | Place a black development marker on any undeveloped city that already has ≥1 track cube. +$2 full / +$1 shared to that city. |
| 3 | **Fund $5** | "$$" over a locomotive | Take $5 from the bank, add it to any one company's treasury. |
| 4 | **Take $2 (or Expand 2)** | "$2" + figure, with "(▢▢)" below | Take $2 from the bank (or take $2 from each other player). In 4–5-player games this space may instead be used as an **Expand 2**. |
| 5 | **Expand 3** | 3 cubes | Place up to 3 track cubes (see Expand rules). |
| 6 | **Auction a share** | auctioneer's gavel | Put one share up for auction (min bid $10). |
| 7 | **Expand 4** | 4 cubes (2×2) | Place up to 4 track cubes. |

Notes:
- There are **7 rows, not 8**. "Take $2" and "Expand 2" **share one row** (row 4); there is no
  separate standalone "Take $2" row. (This differs from the draft ordering in the task brief —
  the real board combines Take $2 / Expand 2 and does not repeat Take $2 at the bottom.)
- **Turn order within a phase:** each player, in current turn order, moves their action marker into
  an empty space in the current column and may perform (or decline) that action. A given action
  space, once taken in a phase, is **blocked** for later players that phase — hence the icons
  repeat across three columns for the three phases. (HIGH — rulebook "Action Phases & Turn Order".)
- *Confidence:* the **order and the icon set are HIGH** (read clearly at high zoom). If anything is
  worth a 10-second glance at your board, it's confirming rows 5–7 (Expand 3 / Auction / Expand 4)
  are in that vertical order.

---

## 3. Terrain (costs HIGH; per-region map MEDIUM; per-hex LOW)

**Four terrain types.** Costs are from the rulebook (HIGH) and match the board's cost legend:

| Terrain | Board colour | Cost to place a track cube (paid from the company treasury) |
|---|---|---|
| **City** (cream/white hex with two income numbers) | cream | **$2 + $2** per track cube **or** development marker already in the hex |
| **Plains** | yellow / tan | **$2 + $2** per track cube already in the hex |
| **Forest** | green | **$3** — limit **one** cube per forest hex |
| **Mountain** | blue-grey (rocky texture) | **$5** — limit **one** cube per mountain hex |

Adjacency/stacking rule (HIGH): a hex may never hold two cubes **of the same colour**; forest and
mountain hexes may hold **at most one cube total**. Cities and plains can hold multiple cubes
(of different colours).

**Terrain regions (MEDIUM — read from the board photo):**
- **Plains (yellow)** dominate the **west and centre** (the Midwest — Illinois / Indiana / western
  Ohio / the St. Louis area) and form a thinner **coastal-plain strip** along the Atlantic seaboard
  (roughly New Jersey / Delmarva / Virginia tidewater) and along the **Gulf coast**.
- **Mountains (blue-grey)** form the **Appalachian spine**: a diagonal band running from
  **northern Georgia / eastern Tennessee** up through **West Virginia** into
  **central/western Pennsylvania**. This is the clearest terrain feature on the board.
- **Forests (green)** fill the **Southeast** (Tennessee, Kentucky, Georgia, the Carolinas) and the
  **mid-Atlantic uplands** flanking the mountains.
- The **Atlantic Ocean** (right / southeast) and **Gulf of Mexico** (bottom-left) are impassable
  border art, not playable hexes.

---

## 4. Hex grid & adjacency (MEDIUM)

- The playing area is a single connected **hex grid**. Hexes read as **flat-top** hexagons arranged
  in **offset vertical columns** (each column shifted half a hex against its neighbours).
- With that layout, a typical interior hex has **six neighbours**: directly above, directly below,
  and two on each side (upper-left, lower-left, upper-right, lower-right).
- **Expand** places a cube on a hex **orthogonally adjacent to another cube of the same colour**, so
  your data model needs the 6-neighbour adjacency for every hex. Coastline/ocean hexes are dead
  edges (no neighbour there).
- I could **not** reliably count the exact number of columns and rows from the low-res image, nor
  produce exact hex coordinates. **Confirm grid dimensions and the coastline shape from a board
  photo** before finalising the map data structure.

---

## 5. Cities

### 5a. Non-developable "hub" cities (HIGH)
The rulebook states explicitly: **New York, Baltimore, Philadelphia, Boston, and Chicago** cannot be
developed (they have a **black square** next to their income values; no development marker is ever
placed on them, and their income never exceeds the printed map value).

### 5b. Special-connection cities (HIGH)
The three cities that trigger the **$10 connection bonus** are **Chicago, New York, and Atlanta**.
A company earns **+$10** the moment its track connects any *pair* of them
(Chicago–New York, Chicago–Atlanta, or New York–Atlanta). Each pair pays out **once**.
Connecting the **third** city completes two pairs at once, so it adds **+$20** at that moment
(net $30 total for connecting all three). These bonuses are **on top of** the cities' normal
income values.

### 5c. City income values (mostly LOW — VERIFY FROM PHOTOS)

Format is **full / shared**: full value applies when only one company has track in the city; shared
value applies once two or more companies are present.

**Confirmed (HIGH / MEDIUM-HIGH):**

| City | Full / Shared | Type | Confidence | Basis |
|---|---|---|---|---|
| **New York** | **8 / 5** | hub (non-dev), special connection | HIGH | Printed in the rulebook's "City Hex" legend |
| **Buffalo** | **4 / 3** | developable | HIGH | Rulebook worked example ("difference … of Buffalo (4-3)") |
| **Atlanta** | **5 / 3** | special connection, developable | MEDIUM | Read off board; carries the special-connection mark |
| **Philadelphia** | **6 / 4** | hub (non-dev) | MEDIUM | Read off board; shows the black square |
| **Pittsburgh** | **5 / 3** | developable | MEDIUM | Read off board |

**Placeholder readings (LOW — names inferred from US geography, numbers squinted off an 800 px
image; DO NOT trust these, confirm every one):**

| City (approx. region) | Full / Shared (LOW) | Notes |
|---|---|---|
| Chicago (NW plains) | *unread* | Confirmed hub + special connection; **value not legible** |
| Baltimore (mid-Atlantic) | ~5 / 3 ? | Confirmed hub; value uncertain |
| Boston (far NE) | *unread* | Confirmed hub; value uncertain |
| Washington D.C. | ~? | near Philadelphia/Baltimore |
| Cleveland | ~4 / 2 ? | |
| Cincinnati | ~4 / 2 ? | used in rulebook Develop example (developable) |
| Indianapolis | ~4 / 2 ? | |
| Columbus | ~1 / 1 ? | |
| Louisville | ~1 / 1 ? | |
| Fort Wayne | ~2 / 1 ? | |
| Toledo / Detroit | ~? | northern Midwest |
| St. Louis | ~? | far west; used in rulebook Expand example (developable) |
| Nashville | ~4 / 2 ? | |
| Chattanooga | ~4 / 2 ? | |
| Knoxville | ~2 / 1 ? | |
| Birmingham | ~2 / 1 ? | |
| Montgomery | ~2 / 1 ? | |
| Mobile | ~2 / 1 ? | Gulf coast |
| New Orleans | ~2 / 1 ? | Gulf coast |
| Richmond | ~2 / 1 ? | |
| Raleigh | ~2 / 1 ? | |
| Charlotte | ~3 / 2 ? | |
| Wilmington | ~2 / 1 ? | coastal |
| Charleston | ~3 / 2 ? | coastal |
| Savannah | ~3 / 2 ? | coastal |
| Albany | ~3 / 2 ? | NE |
| Scranton / Harrisburg | ~1–2 / 1 ? | PA |

> The exact set of cities and their values is the main thing to capture from your board photos.
> When you photograph, go city-by-city and record: **name**, **full value**, **shared value**, and
> whether it has the **black square** (hub) and/or the **special-connection mark**.

---

## 6. City income & dividend rules (HIGH — relevant to the map model)

From the rulebook, so your map data drives these correctly:

- **First cube in a city** → that company's income goes up by the city's **full** value.
- **Second cube (different company)** → the newcomer gains the **shared** value; the company that
  was already there is **reduced** from full down to shared (subtract full − shared).
- **Third+ cube** → each additional company gains the **shared** value. No cap on company income.
- **Development marker** adds **+$2 to full** and **+$1 to shared** for that city (so a solo company
  in a developed city gets +$2; if a second company enters, the development bonus each gets is +$1).
  Reminder: the five hub cities can never be developed.
- **Dividends** (end of each round): each company pays, per player-held share,
  `company income ÷ number of player-held shares, rounded up`. Unsold/removed shares don't count.

---

## 7. Other board-relevant facts (HIGH)

- **Six companies**, each a colour: **American** (white), **National** (grey), **Continental**
  (green), **Majestic** (yellow), **Liberty** (red), **Republic** (blue). In a 3-player game one
  random company is removed.
- Cube/share counts (for supply-exhaustion end condition): American 31 cubes/5 shares,
  National 29/4, Continental 26/3, Majestic 22/4, Liberty 19/2, Republic 17/3;
  **144 track cubes and 21 shares** total, plus **12 black development markers**.
- **Game length:** up to **7 rounds (1851–1857)**; each round = 3 action phases + 1 dividend phase.
- Placing a cube requires an **adjacent same-colour cube**; a company's *first* cube (bought via the
  first share of a new company) may be placed on **any empty city**, setting the company's income to
  that city's full value.

---

*Compiled from the sources in the table above. The rulebook items are solid; the map/city specifics
are limited by image resolution and are flagged accordingly. Verify all MEDIUM/LOW items — and the
full city-value table in particular — against photographs of the physical board.*
