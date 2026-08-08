# Build checklist — American Rails

Work through this in order. Each item says which file to get it from.

## Before you write anything

- [ ] Load **Cinzel** (500, 600, 700, 900) and **EB Garamond** (400, 500, 600,
      700 + italics) from Google Fonts. Everything else assumes these are present.
- [ ] Open `board-static.html` and `pieces-static.html` in a browser. That is the
      target. Keep them open while you work.
- [ ] Read `board-data.json` and `pieces-data.json`. Between them they hold every
      coordinate, colour and path you need. You should not have to measure
      anything off an image.

## The board

Source of truth for appearance: **`board-static.svg`**. Use it verbatim, or lift
paths out of it. Do not redraw terrain textures or icons from prose.

- [ ] Board is **1700 × 1400** user units
- [ ] Blue scoring frame, 44 units thick, ending at y 1240 — `scoringFrame` in
      board-data.json has all 100 cells with number, position and rotation
- [ ] Every tenth cell highlighted `#28527f`
- [ ] Parchment map field at 44,44, 1612 × 1152, with graticule and vignette
- [ ] Hex grid: pointy-top, R 41, spacing √3·R horizontally and 1.5·R per row,
      origin (120, 97), odd rows offset right by half a column
- [ ] **215** land tiles placed from `cells` — 94 forest, 62 plains, 39 city,
      20 mountain. The 145 ocean slots are simply not drawn; that absence is the
      coastline
- [ ] Terrain fills are tiling patterns, not flat colours — take them from the
      static SVG's `<defs>`
- [ ] 39 cities, each with value, skyline, name — see `cityMarks` for offsets
- [ ] Rail ties on the 3 start cities: Chicago, New York, Atlanta
- [ ] Port markers on the 5 ports: Chicago, Baltimore, Philadelphia, New York,
      Boston. Note the value text shifts 7 units left on these
- [ ] Title block, action table, year track, legend, house supply, company strip
      — all positioned in `panels`
- [ ] Action table outline is **notched**, not a rectangle:
      `M0 0 H384 V478 H80 V338 H0 Z`
- [ ] Action table has 5 numbered bands plus 2 unnumbered auction bands
- [ ] Year track: 7 cells, each year label centred over its own circle, 7th cell
      has no triangle
- [ ] Legend has **no header label** and both hex sub-labels read
      "+$2 per cube"
- [ ] 5 map labels from `mapLabels`

## The pieces

Source of truth for appearance: **`pieces-static.html`**.

- [ ] 5 player locomotives — natural, purple, pink, brown, orange
- [ ] 1 black year marker, same cutting
- [ ] 6 company cubes — American, National, Continental, Majestic, Liberty,
      Republic
- [ ] 6 share cards, 88 × 62 mm landscape
- [ ] Black house tokens
- [ ] Company colours match the board's company plates and cubes exactly

## Things that are deliberately unfinished

Do not invent content for these. Ask first.

- [ ] **Company plate art wells** on the board — six empty `#241d16` panels.
      They want real locomotive illustrations
- [ ] **Share card illustrations** — procedural line placeholders, not
      engravings. Wells are 262 × 122; keep that proportion
- [ ] **Map ornament** — the physical board has coastline hatching, rivers, state
      lines and dozens of small place names (Cape Hatteras, Long Bay, Onslow Bay,
      Port Royal Entrance…). This design uses clean parchment instead

## Open questions for the designer

- [ ] Does the physical board have another hex column west of Rock Island /
      Memphis / New Orleans? The source screenshot was clipped at the left edge
- [ ] Is 88 × 62 mm right for the share cards?
- [ ] Is 8 mm right for locomotive and cube thickness?

## Acceptance

Put your build side by side with `board-render.png` and `pieces-render.png`.
Specifically check:

1. Terrain reads as **engraved** — grass tufts, tree canopy with highlight and
   shade arcs, ridge lines with hachure. Not cartoon bushes or triangles
2. Hexes tessellate with no gaps and the coastline silhouette matches
3. City values and names sit inside their hexes at the right sizes
4. Scoring numbers on the left and right edges are rotated
5. The action table's notch is present
6. Nothing overlaps: the house supply area clears the panel, the year track, and
   the coastline

## No AI-generated imagery

Every mark in this package is vector geometry. Nothing was image-generated, and
nothing should be.
