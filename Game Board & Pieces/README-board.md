# Handoff: American Rails — game board

## Overview

A complete visual design for the *American Rails* board: an 18-row × 20-column
pointy-top hex map of the eastern United States, a blue perimeter scoring track
numbered 0–99, a three-column action selection table, a seven-year turn counter,
a terrain-cost legend, a dashed house-supply area, and six railroad company
plates along the bottom edge.

The whole board is a single SVG drawn at **1700 × 1400 user units**, plus a thin
HTML text layer on top (explained under *Why there are two layers*).

## About the design files

**Start with `board-static.svg`.** It is this design exported as one fully
resolved SVG — all 215 hexes, every terrain texture stroke, every icon and every
label as a literal element at 1700 × 1400. Use it as-is, or lift shapes out of
it. Do **not** redraw the terrain textures or the action-table icons from the
written descriptions below; the descriptions explain intent, the SVG defines
appearance.

`American Rails Board.dc.html` is the **source** of that SVG — a template that
computes the layout at load time. It is useful if you want to change the
generated geometry, not for reading off shapes.

`board-data.json` is the part to treat as **authoritative data**. It carries every
tile, city, value and coordinate already computed, so you never need to re-derive
the geometry or re-read the map by eye.

When you rebuild this in a real project, use the project's own rendering approach
— React components, a canvas renderer, a game engine, SVG templating, whatever
already exists. If the project has no established approach yet, pick what suits a
board-game UI.

## Fidelity

**High fidelity.** Colors, typography, spacing, and geometry are final. Match
them. The exact hex values, font sizes and coordinates are all listed below and
in `board-data.json`.

## Files in this bundle

| File | What it is |
|---|---|
| `board-static.svg` | **The board, fully resolved.** Use this; don't redraw from prose |
| `board-static.html` | The same SVG in a page with fonts loaded — open to view |
| `README-board.md` | This spec — data model and rationale |
| `board-data.json` | Machine-readable board data: grid, 215 tiles with coordinates, 39 cities, companies, geometry constants |
| `board-render.png` | 3042 × 2506 render of the finished board. **This is what it should look like** — check your work against it |
| `American Rails Board.dc.html` | The design reference. Open in a browser to see the board |
| `support.js` | Runtime the reference file needs in order to render. Keep it beside the HTML; do not port it |

To view the design: keep both files in the same folder and open the `.html` in
a browser. Do not try to reuse `support.js` in the target project — it is only
there so the reference renders.

### Do not read the `.dc.html` source expecting to find the board

`American Rails Board.dc.html` is a **template**, not a drawing. Its source
contains `{{ }}` placeholders, `<sc-for>` repeat elements, and a JavaScript class
that computes all 215 tile positions, 39 city labels, and the procedural terrain
textures at load time. Read as text it looks nothing like a game board, because
the board does not exist until the page runs.

That is what `board-static.svg` is for — the template already executed and
flattened. Use it.

Work from `board-static.svg` for appearance and `board-data.json` for the data
model, with `board-render.png` as the visual check.

The pieces that go on this board — player locomotives, year marker, company
cubes, share cards, house tokens — are specified separately in
`README-pieces.md`.

## Why there are two layers

In `American Rails Board.dc.html` every shape is SVG but every piece of **text**
is an absolutely positioned HTML `<div>` over the top, because of a constraint in
that file's templating layer. **`board-static.svg` has already fixed this** — all
209 text items are proper `<text>` elements with the right anchor and baseline.
If you work from the static SVG you can ignore this section entirely; it only
matters if you go back to the template.

---

## Coordinate system

Design space is 1700 × 1400. Everything below is in those units.

```
0,0 ─────────────────────────── 1700,0
 │  blue scoring frame, 44 units thick,
 │  outer edge of board, height 1240
 │   ┌────────────────────────┐
 │   │ map field 44,44        │
 │   │ 1612 × 1152 parchment  │
 │   └────────────────────────┘
 │  y=1240 ── scoring frame ends
 │  company plates y 1252 → 1390
0,1400 ───────────────────────── 1700,1400
```

## Hex grid

Pointy-top hexes, odd rows offset right by half a column.

```
radius R           = 41          (center to vertex)
horizontal spacing = √3 · R      = 71.0141
row spacing        = 1.5 · R     = 61.5
origin             = (120, 97)   center of col 0, row 0

cx = 120 + col · 71.0141 + (row % 2) · 35.507
cy = 97  + row · 61.5
```

Hex vertex path, relative to center:

```
0,-41   35.51,-20.5   35.51,20.5   0,41   -35.51,20.5   -35.51,-20.5
```

Stroke `#33271b` at 1.7 units.

The grid is 20 columns × 18 rows, but only **215** of the 360 slots hold land.
The rest are ocean and are simply not drawn — that absence is what forms the
Atlantic coastline and the Gulf. `board-data.json → grid` holds the map as 18
strings of 20 characters:

```
O = ocean / not drawn    P = plains    F = forest    M = mountain    C = city
```

`board-data.json → cells` is the same information already expanded into 215
objects with `col`, `row`, `terrain`, `x`, `y`, and where applicable `city`,
`value`, `port`, `startCity`. Prefer this over parsing the grid strings.

Terrain distribution: 94 forest, 62 plains, 39 city, 20 mountain.

## Terrain fills

Each terrain is a tiling pattern, drawn once and repeated. The patterns are
procedurally scattered in the reference (seeded, so they are stable), but the
essentials are the base color plus a motif:

| Terrain | Base | Motif |
|---|---|---|
| Plains | `#d9a938` | Grass tufts: three-stroke blades, `#a97b1d`, 4.6–8.2 units tall, some with a seed head |
| Forest | `#8e9b40` | Tree crowns: filled circles r 3.4–6.8 in `#6c7a2a`, each with a `#76842f` highlight arc top-left, a darker shade arc bottom-right, and a short trunk |
| Mountain | `#b3aea3` | Ridge rows: six overlapping ranges of 6–8 peaks, 9–17 units tall, bodies `#8f8a80`, shadow wedges `#736f66`, hachure strokes `#45423b` |
| City | `#f1e8ce` | Sparse small blocks, plus a second inset hexagon outline at r 34.6 in `#8a7448` at 0.6 opacity |

Land hexes carry a drop shadow: `dx 5, dy 7, blur 8, #3d2a12 at 0.34`.

The parchment field beneath is `#e7d7b3` with soft lighter/darker blotches, a
132-unit graticule grid in `#8d6e3e` at 0.18 opacity, and a radial vignette
darkening to `#6b4b1f` at 0.13 at the edges.

## City hexes

Each of the 39 cities carries three or four marks, all centered on the hex:

1. **Value** — e.g. `7/5`, positioned above center (see *Text placement*)
2. **Skyline** — a row of small buildings, `#3d2e1d` at 0.82 opacity, one with a
   pitched roof, scaled 1.17×, offset `y + 4` from hex center
3. **Name** — below center
4. **Rail ties** — a short ladder of track, only on the three start cities
   (Chicago, New York, Atlanta), offset `y + 31`
5. **Port marker** — a black gabled building with a red diagonal slash
   (`#14110d` body, `#b5342b` slash), offset `x + 20, y - 13`, on the five port
   cities: Chicago, Baltimore, Philadelphia, New York, Boston. When a city has a
   port marker its value text shifts 7 units left to clear it.

All 39 cities with their values and grid positions are in `board-data.json`.

## Scoring track

A blue frame around the map: `#1e3c60`, 44 units thick, spanning 0,0 to
1700,1240. Every tenth cell is highlighted `#28527f`. Cell dividers `#16293f` at
1.1 units. Two hairline rules in `#82a0bd` at 0.5 opacity, inset 5 and 40 units.

- **Top edge**: 31 cells, left to right, numbered 20 → 50
- **Right edge**: 19 cells, top to bottom, 51 → 69, text rotated 90°
- **Bottom edge**: 31 cells, left to right, 0 then 99 → 70
- **Left edge**: 19 cells, top to bottom, 19 → 1, text rotated −90°

Numbers are `#f2e6c8`, weight 600, EB Garamond.

## Action table

Positioned at `translate(1250, 556)`, 384 wide, 478 tall. Fill `#f4ecd6`,
stroke `#5d4726` at 2.

The outline is **notched**, not a rectangle:

```
M0 0 H384 V478 H80 V338 H0 Z
```

Above y 338 the panel is full width. Below it, only the right portion (x 80 →
384) continues, so the numbered strip's box ends level with row 5 and the two
unnumbered auction bands stand alone.

**Numbered strip** — `#dccca6` panel at `8,8` 68 × 322. Five circles, r 29,
`#f8f2e0` fill, at cy 39, 101, 164, 230, 297. Digits 1–5 in Cinzel 600 at 42pt,
`#3d2e1d`, baseline cy + 15.

**Three action columns** — at x 92, 192, 292 (`translate(84 + i·100, 0)` with the
column rect starting at x 8 of each group), each 92 wide, y 8 → 470, fill
`#faf5e6`. Row dividers at y 70, 132, 196, 264, 330, 400.

Seven bands, top to bottom:

| Band | y range | Contents |
|---|---|---|
| 1 | 8–70 | Arrow, barbed head with notched rear edge |
| 2 | 70–132 | House token — three-quarter isometric, gabled |
| 3 | 132–196 | `$5` at y 158, locomotive at y 180 |
| 4 | 196–264 | `$2` + person at y 212–217, rule at 229, then `( ▢ ▢ )` at 248 |
| 5 | 264–330 | Three cubes: one at y 285, two at y 309 |
| — | 330–400 | Gavel at y 363 |
| — | 400–470 | Four cubes, 2 × 2, at y 422 and 449 |

Icons are drawn in the tan palette: `#c9a06a` mid, `#ddbb87` light, `#ab7f48`
dark, `#c08c4c` for the arrow, all stroked `#5e3f1a`.

The cube is a true isometric box — lit top face `#ddbb87`, front `#c9a06a`,
shadowed right `#ab7f48`, spanning 18 wide × 21.6 tall.

## Year track

At `translate(1100, 1046)`, 536 wide, 114 tall. Outer fill `#f4ecd6`, inner band
at `8,40` 520 × 66 in `#faf5e6`.

Seven cells of 74.286 units each. Cell center i = `8 + (i + 0.5) · 74.286`.
Dividers run y 40 → 106 at each cell boundary.

Each cell: a circle r 26 at cy 73, `#f8f2e0`, and a right-pointing play triangle
in `#a8814a` stroked `#5d4726`. The **seventh cell has no triangle** — it is the
end of the track.

Each year label 1851–1857 sits centered above its own circle, baseline y 24,
20pt, `#2b2013`.

## Terrain cost legend

At `translate(660, 1034)`. Four hexes at x offsets 47, 141, 235, 329, all at
y 78, drawn at r 27 with the same terrain patterns as the map.

| Hex | Cost | Sub-label |
|---|---|---|
| Plains | `$2` | `+$2 per cube` |
| City | `$2` | `+$2 per cube` |
| Forest | `$3` | — |
| Mountain | `$5` | — |

Cost text 20pt bold `#2b2013` at y +52; sub-label 13.5pt `#6b5433` at y +71.
There is deliberately **no header** on this legend.

## House supply area

A dashed enclosure in the open Atlantic with its top-left corner cut off:

```
M1058 906 L1300 906 L1300 1026 L998 1026 L998 952 Z
```

Stroke `#3d2e1d` at 2.2, dash `11 7`. Inside, three dashed house outlines
(stroke 2, dash `4 4`) in a triangle: one at (1149, 946) and two at (1104, 990)
and (1194, 990), each a gabled pentagon roughly 26 wide × 32 tall.

## Company plates

Six plates along the bottom, `translate(28 + i · 275, 1252)`, each 267 × 138.

Plate structure:
- Body `#15120f`, stroke `#4d4029`
- Header band at `8,8` 251 × 34, fill `#0c0a08`
- **Cube** at (24, 24) — isometric, in the company color, with the left face
  darkened 22% and the right face 42%
- Start value, left-aligned at x 42
- Company name centered at x 133.5, Cinzel 700, 15.5pt, `#ece0c4`,
  letter-spacing 0.1em
- Share count right-aligned at x 222
- **Share rectangle** at `229,18` 25 × 15, in the company color
- Color rule at `8,46` 251 × 3
- Art well at `8,55` 251 × 75, fill `#241d16`, stroke `#3d3323` — currently
  **empty**, intended for a locomotive illustration
- `Railroad Company` in italic 13pt `#8d7a58` centered in the well
- Faint rail-tie texture across the lower part of the well

| Company | Color | Start value | Shares |
|---|---|---|---|
| AMERICAN | `#efe9dc` | 30 | 5 |
| NATIONAL | `#b6b1a5` | 28 | 4 |
| CONTINENTAL | `#3d7a46` | 25 | 3 |
| MAJESTIC | `#dcb62c` | 21 | 4 |
| LIBERTY | `#b4382e` | 18 | 2 |
| REPUBLIC | `#2f6fae` | 16 | 3 |

## Title block

At `translate(1442, 472)`, centered:

- `AMERICAN RAILS` — Cinzel 900, 42pt, letter-spacing 1, `#2b2013`
- Rule, 372 wide, `#5d4726` at 1.6
- `Tim Harrison` — EB Garamond italic 22pt, `#5d4726`
- Rule at 0.9
- `ARTWORK ALEXANDRE ROCHE` — Cinzel 500, 12pt, letter-spacing 3

## Map labels

All in `#8d6e3e`, low opacity, sitting on the parchment:

| Label | Position | Style |
|---|---|---|
| `Lake Illinois` | 300, 104 | EB Garamond italic 18pt, ls 2, 0.8 opacity |
| `Lake Erie` | 660, 104 | same |
| `THE ATLANTIC` / `OCEAN` | 1150, 830 / 862 | Cinzel 600, 19pt, ls 3.5, 0.55 |
| `GULF OF MEXICO` | 400, 1172 | Cinzel 600, 20pt, ls 8, 0.48 |

## Text placement

Relative to a hex center at (x, y):

| Text | Anchor |
|---|---|
| City value | x (or x − 7 if the city has a port marker), y − 10, centered horizontally, bottom-aligned. 24pt, weight 700 |
| City name | x, y + 15, centered horizontally, top-aligned. 13.2pt normally; 12.2pt for names over 8 characters; 11.4pt over 10 |

City text color `#241a10`.

## Design tokens

**Parchment and panels**

| Token | Value |
|---|---|
| Parchment base | `#e7d7b3` |
| Panel fill | `#f4ecd6` |
| Panel inner fill | `#faf5e6` |
| Numbered strip | `#dccca6` |
| Circle fill | `#f8f2e0` |
| Panel stroke | `#5d4726` |
| Map label / ornament | `#8d6e3e` |
| Body text dark | `#2b2013` |
| Secondary text | `#6b5433` |

**Terrain**

| Token | Value |
|---|---|
| Plains | `#d9a938` / detail `#a97b1d` |
| Forest | `#8e9b40` / crown `#6c7a2a` / highlight `#76842f` |
| Mountain | `#b3aea3` / ridge `#8f8a80` / shadow `#736f66` |
| City | `#f1e8ce` / inner ring `#8a7448` |
| Hex stroke | `#33271b` |

**Scoring frame**

| Token | Value |
|---|---|
| Band | `#1e3c60` |
| Decade highlight | `#28527f` |
| Divider | `#16293f` |
| Hairline | `#82a0bd` at 0.5 |
| Number | `#f2e6c8` |

**Icon palette**

| Token | Value |
|---|---|
| Light face | `#ddbb87` |
| Mid face | `#c9a06a` |
| Dark face | `#ab7f48` |
| Arrow | `#c08c4c` |
| Icon stroke | `#5e3f1a` |
| Port marker body | `#14110d` |
| Port marker slash | `#b5342b` |

**Company plates**

| Token | Value |
|---|---|
| Plate body | `#15120f` |
| Header band | `#0c0a08` |
| Art well | `#241d16` |
| Plate stroke | `#4d4029` |
| Well stroke | `#3d3323` |
| Plate text | `#ece0c4` |
| Plate italic | `#8d7a58` |

**Typography**

Two families, both Google Fonts:

- **Cinzel** — weights 500, 600, 700, 900. Titles, scoring numbers, action
  numbers, map ornament labels
- **EB Garamond** — weights 400–700 plus italics. City names and values, dollar
  amounts, year labels, company names, body text

Minimum text size on the board is 11.4pt at design scale (the longest city
names).

## Behavior

The board is static — no interactions, animations, hover states, or state
management. It is a playing surface. Any interactivity (placing track, moving
trains along the year track, sliding score markers around the frame) is yours to
add; the design only defines where those things go.

## Assets

None external. Every mark is vector geometry defined in the file. The six
company art wells are intentionally empty and want real locomotive
illustrations — no AI-generated art was used or is implied.

## Open items

Three things were deliberately left out and may need attention:

1. **Company plate artwork** — the six art wells are empty placeholders
2. **Map ornament** — the physical board has coastline hatching, rivers, state
   lines, and dozens of small place names (Cape Hatteras, Long Bay, Onslow Bay,
   Port Royal Entrance, and so on). This design uses clean parchment instead
3. **Leftmost column** — worth confirming against the physical board whether a
   further hex column exists west of Rock Island / Memphis / New Orleans
