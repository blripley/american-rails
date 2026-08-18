# Canadian Rails 1851 — board bundle

The second map for *American Rails*: the Province of Canada (Canada West and
Canada East) with New Brunswick, Nova Scotia and Prince Edward Island, as they
stood in **1851**. This is the finished board, already built into the game — pick
it from the **Map** dropdown in the lobby.

The files here are the reference copies. The live board lives inside
`../index.html` as `<template id="tpl-board-ca">`, injected by
`../scripts/canada/inject.mjs`.

| File | What it is |
|---|---|
| `canada-board-draft.svg` | The board, fully resolved at 1700 × 1400 |
| `canada-board-draft.html` | The same board in a page with the fonts loaded — **double-click to view it** |
| `canada-board-render.png` | Render of the board |
| `canada-in-game.png` | The board running in the game |
| `canada-board-data.json` | Authoritative data — 190 tiles, 39 cities with values, hubs, connection cities, terrain grid, region notes |
| `canada-cities.json` | Every city: real lat/lon, 1851 population, a historical note, and any hand-nudge with its reason |
| `canada-terrain.json` | The 22 × 26 terrain grid as ASCII, plus what each region is and why |
| `../docs/canada-board-research.md` | The history: sources, the value ladder, period names, departures from true geography |

## How it was drawn

Nothing was redrawn. `../scripts/canada/make-board-svg.mjs` lifts the American
board's entire `<defs>` block **verbatim** — the parchment and terrain patterns,
the four hex tiles, the skyline, port marker and rail ties, every action icon,
both typefaces — together with the frame, the 0–99 scoring track and the printed
panels. It then regenerates only what is map-specific: the hex field, the city
furniture, the water labels, the title and the panel positions. That is why it
reads as the same board rather than as an imitation of it.

The Canadian tile is radius **34** on a **26 × 22** grid, against the American
41 on 22 × 18. The smaller tile buys 44% more cells inside the same frame, which
is what pulls the crowded Lake Erie and Lake Ontario shores apart into separate
tiles. Pieces scale with the tile automatically.

## Rebuilding

```
node scripts/canada/build-map.mjs      # validate + emit canada-board-data.json
node scripts/canada/make-board-svg.mjs # emit the board SVG and preview page
node scripts/canada/inject.mjs         # splice both into index.html (idempotent)
```

`build-map.mjs` fails the build on a duplicate city name, a city on an off-map
tile, an unreachable tile, the wrong number of hubs or connection cities, or
**any two cities being adjacent** — the American board has zero adjacent city
pairs and that turns out to be load-bearing, because city tiles are cheap and
hold several cubes, so a chain of touching cities is a free conveyor of income.

`space-cities.mjs` is the helper that works out how to keep cities apart: it
prefers moving a town one tile to deleting it, and only cuts when a town cannot
be placed.

## The design in short

- **39 cities**, printed value 115/74. Deliberately *not* matched to the American
  board's 128: this board is 12% smaller, so the same printed value produces far
  more income. It is calibrated on measured winner's money and money spread
  instead, which land at $300/153 against the American $296/153.
- **Five non-developable port hubs**: Montréal, Québec, Toronto, Halifax, Saint John.
- **Three connection cities**: Toronto — Montréal — Halifax, the Main Trunk Line
  Act of 1851 plus the Intercolonial attached to it.
- **Two barriers, not one.** The Canadian Shield to the north and the
  Appalachians to the east, with the St Lawrence lowlands as the single cheap
  corridor between them, and three chokepoints that are real geography: the
  Frontenac Axis, the Matapédia gap, the Chignecto Isthmus.
- **Period names**: Bytown (not Ottawa), The Bend (not Moncton), Port Sarnia,
  Newcastle for the Miramichi.
- **Companies** keep their colours, cube counts and share counts; only the
  printed names change — Grand Trunk, Great Western, Northern, St Lawrence &
  Atlantic, European & North American, Nova Scotia Railway.
