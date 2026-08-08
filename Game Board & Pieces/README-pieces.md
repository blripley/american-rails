# Handoff: American Rails — game pieces

## Overview

Component art for the physical pieces of *American Rails*: five player
locomotives, a black year marker, six company cubes, six company share cards,
and black house tokens.

All of it is drawn as inline SVG at a fixed design scale, laid out on a single
parchment sheet.

## About the design files

**Start with `pieces-static.html`.** It is this sheet with every symbol reference
flattened into real shapes — open it and you see the pieces. Use it as the
appearance reference and lift geometry from it.

`pieces-data.json` holds the same information as data: every colour, size,
outline path and layout constant.

`American Rails Pieces.dc.html` is the **source** of both — a template that
computes the share-card engraving at load time. Useful only if you want to change
the generated geometry.

Note the two audiences for this sheet:

- **Physical manufacture** — the locomotive, cube and house shapes are cutting
  and painting specs for real wooden pieces. Sizes are given in mm.
- **Digital rendering** — if the game is being built as software, these same
  silhouettes are the token art.

The share cards are printed cards, 88 × 62 mm.

## Fidelity

**High fidelity.** Colours, typography and geometry are final. One exception,
called out below: the share-card illustrations are line placeholders, not final
engravings.

## Files in this bundle

| File | What it is |
|---|---|
| `pieces-static.html` | **The pieces, fully resolved.** Open to view; use this, don't redraw |
| `pieces-data.json` | **Authoritative piece data** — every colour, size and outline path |
| `README-pieces.md` | This spec — data model and rationale |
| `pieces-render.png` | 2880 × 5360 render of the finished sheet — visual target |
| `American Rails Pieces.dc.html` | Design source (a template — see below) |
| `support.js` | Runtime the `.dc.html` needs to render. Keep it beside the HTML; do not port it |

### Do not read the `.dc.html` source expecting to find the pieces

Like the board file, it is a **template**. The share-card scenes in particular are
generated: hatching, treelines, telegraph poles and rail sleepers are emitted by
loops, so the source is full of computed path data rather than readable shapes.
Use `pieces-static.html` — the same thing already flattened — and check against
`pieces-render.png`.

---

## 1. Player locomotives

Five pieces, one per player. **30 × 19 × 8 mm**, cut from 8 mm ply and painted
through so the cut edge carries the same colour as the face.

A single flat silhouette in profile, facing right. Mirror the path for a
left-facing variant.

**Outline**, in design units (the shape spans roughly x 1→105, y 5→67):

```
pilot wedge   M91 44 L105 44 L105 57 L91 53 Z
frame         M2 44 H98 V54 H2 Z
cab body      M6 16 H38 V44 H6 Z
cab roof      M1 10 H43 V16.5 H1 Z
boiler        M37 21 H85 V44 H37 Z
smokebox      circle cx 84 cy 32.5 r 11.5
stack         M76 22 H92 L95 5 H73 Z        (flared)
steam dome    M52 15 H63 V22 H52 Z
wheels        circles cy 58 r 9.4 at cx 18, 44, 70
```

The reference renders each piece as an extruded solid: the same silhouette
offset up-and-right in a darker shade to suggest 8 mm of thickness, with the face
colour on top, plus faint diagonal grain lines. For a flat digital token, drop
the extrusion and use the face colour only.

| Player | Face | Extrusion shade |
|---|---|---|
| Natural | `#dcc79f` | `#ad9367` |
| Purple | `#5e2a55` | `#3a1633` |
| Pink | `#c22a5e` | `#821539` |
| Brown | `#8a6524` | `#583f12` |
| Orange | `#e2691a` | `#95430c` |

Grain overlay: five short diagonal strokes, `#000` at 0.12 opacity, width 1.1.

## 2. Year marker

One piece. Identical cutting to the player locomotives, in black.

| Face | Extrusion shade |
|---|---|
| `#23262e` | `#0d0f13` |

Behaviour: starts in the 1851 circle on the board's year track and moves one cell
right at the end of each year. The seventh circle ends the game.

## 3. Company cubes

Six colours, one per company. **8 mm wooden cubes.** Companies have no
locomotive — cubes are their only piece.

Drawn as an isometric box with three visible faces:

```
top    M4 16 L30 2 L56 16 L30 30 Z
left   M4 16 L4 44 L30 58 L30 30 Z
right  M56 16 L56 44 L30 58 L30 30 Z
```

Stroke `#3d2e1d` at 1.4, round joins.

| Company | Top | Left | Right |
|---|---|---|---|
| American | `#efe9dc` | `#c4bfb2` | `#9d998e` |
| National | `#b6b1a5` | `#918d83` | `#6f6c64` |
| Continental | `#3d7a46` | `#316138` | `#24482a` |
| Majestic | `#dcb62c` | `#b09123` | `#836c1a` |
| Liberty | `#b4382e` | `#902d25` | `#6c221c` |
| Republic | `#2f6fae` | `#26598b` | `#1c4368` |

These match the cube icons on the board's action table and the cubes on the
company plates along the board's bottom edge.

## 4. Company share cards

Six cards, **88 × 62 mm** landscape, purchased by players and held in hand.

Drawn at 300 × 212 design units.

### Structure

| Element | Geometry |
|---|---|
| Black edge | full bleed `#100e0c` |
| Colour field | inset 9 units, 282 × 194, company base colour |
| Outer engraved rule | `x13 y13 274 × 186`, stroke 1.6 |
| Inner engraved rule | `x17 y17 266 × 178`, stroke 0.7 |
| Company name | centred, baseline y 45, Cinzel 700, 23pt, letter-spacing 1.8 |
| Hairline | `M42 52 H258`, stroke 0.8 |
| Sub-line | `Railroad Company`, centred, baseline y 66, EB Garamond italic 12pt |
| Illustration well | `translate(19,72)`, 262 × 122, fill `#efe8d6`, stroke 1.4 |

Both rules and the ornaments use the company's dark shade at 0.55 / 0.5 opacity.

### Frame ornaments

Scroll shapes in the dark shade at 0.5 opacity: four corner scrolls, a centred
flourish top and bottom, and small paired flourishes at the mid-height of the
left and right edges.

### Colours

| Company | Base field | Mid (scene tint) | Dark (rules, ink) | Name ink |
|---|---|---|---|---|
| Continental | `#2f7a3f` | `#1d5029` | `#0f2e17` | light |
| Majestic | `#e8c62a` | `#a8891a` | `#4a3c07` | dark |
| Republic | `#2f7fc4` | `#1d5387` | `#0d2c4c` | light |
| American | `#e9e6dd` | `#a8a49a` | `#454239` | dark |
| Liberty | `#cf2b26` | `#8e1a17` | `#3d0b0a` | light |
| National | `#9c9a92` | `#6d6b64` | `#2f2e2a` | dark |

Light ink `#f5f0e5`, sub-line at 0.62 opacity. Dark ink `#1a1712`, sub-line at
0.6. American, Majestic and National take dark ink.

### Illustration well — engraved scene

Drawn in the well's own 262 × 122 coordinate space, clipped to the well. Horizon
at y 62. All strokes in the company's mid or dark shade at low opacity, so each
card is a duotone of its own colour.

Layers, back to front:

1. **Sky** — horizontal lines from y 5 to the horizon at 3.1 spacing, width and
   opacity both tapering toward the horizon
2. **Clouds** — three, each built from seven stacked chord lines inside an
   ellipse, width 0.9 at 0.5 opacity
3. **Birds** — three small double-arc marks
4. **Far range** — one wavy filled path along the horizon at 0.26 opacity, with
   16 hachure strokes up the slopes
5. **Wooded ridge** — a second lower range at 0.42 opacity, topped with 26
   individually placed conifer triangles, then a firm horizon rule
6. **Plain** — filled band to the bottom, with horizontal lines from y 80 down,
   thickening and darkening toward the viewer
7. **Telegraph poles** — seven, spaced along the track, each with two crossarms,
   scaling down toward the right
8. **Track** — runs across the scene, rising and narrowing to the right:
   centre `y = 112 − 17t`, `x = 4 + 254t`, scale `1 − 0.46t` for `t` in 0→1.
   Ballast band, vertical sleeper ticks at increasing spacing, then two rails
9. **Train** — profile, hauling **left**. Locomotive at `t = 0.14`, four cars at
   `t = 0.26, 0.38, 0.50, 0.62`, each positioned and scaled by the track
   functions above. Smoke is four ellipse puffs rising and drifting right off the
   stack
10. **Foreground** — 14 scrub tufts along the bottom edge

Car windows are `#efe8d6` at ~0.48 opacity, which reads as lit glass against the
dark bodies.

> **The scenes are placeholders.** They are procedural line drawings, not real
> engravings — no illustration art was generated. The wells are sized to take
> proper engravings when they exist; keep the 262 × 122 proportion.

## 5. House tokens

Solid blocks in black. Same gabled house that appears as the row 2 icon on the
board's action table. Players take them from the dashed supply area on the board
and place them on the map.

Three-quarter view, three faces, ridge running front-to-back:

```
front gable   M4 28 L4 12 L9.5 4 L15 12 L15 28 Z     fill #2a2c33
right wall    M15 12 L27 6.6 L27 22.6 L15 28 Z       fill #101216
roof plane    M9.5 4 L21.5 -1.4 L27 6.6 L15 12 Z     fill #3f424b
```

Stroke `#000` at 1.4, round joins. The three greys keep the form readable at
token size; a flat silhouette loses the roof.

## Sheet layout

The reference presents everything on one parchment sheet, 1440 units wide:

- Background `#221d18`, sheet `#e7d7b3` with a 2-unit `#5d4726` border
- Header `GAME PIECES` in Cinzel 700 30pt, with an italic sub-line
- A hero panel: one large orange locomotive beside a construction note
- Then five sections, each opened by a Cinzel 15pt label at letter-spacing 3 in
  `#5d4726` above a 1-unit rule: player locomotives, year marker, company cubes,
  company share cards, house tokens

## Design tokens

| Token | Value |
|---|---|
| Page background | `#221d18` |
| Sheet | `#e7d7b3` |
| Sheet border / labels | `#5d4726` |
| Body text | `#3d2e1d` |
| Heading ink | `#2b2013` |
| Illustration paper | `#efe8d6` |
| Card edge | `#100e0c` |
| Drop shadow tint | `#6b4b1f` at 0.16–0.18 |

**Typography** — Cinzel (500, 600, 700) for names, labels and headings;
EB Garamond (400, 600, italic) for body text, sub-lines and captions. Both from
Google Fonts.

## Behaviour

Static artwork. No interactions or state.

## Open items

1. **Share-card illustrations** — placeholders; want real engravings
2. **Card size** — 88 × 62 mm was my assumption; confirm against your card stock
3. **Piece thickness** — 8 mm assumed for locomotives and cubes
4. **Company plate artwork on the board** — still empty wells, see the board
   handoff
