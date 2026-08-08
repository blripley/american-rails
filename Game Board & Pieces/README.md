# American Rails — design handoff

Visual design for the *American Rails* board game. Two deliverables: the game
board and the physical pieces.

## Read this first

**`board-static.svg` is the board.** It is the finished design exported as one
fully resolved SVG: all 215 hexes, every terrain texture stroke, every icon,
every label, laid out as literal elements at 1700 × 1400. Nothing in it is
computed at runtime.

**`pieces-static.html` is the pieces.** Same idea — the piece sheet with every
symbol reference flattened into real shapes, so nothing depends on runtime
resolution.

Use both directly. Embed them, or lift shapes out of them. Do **not** redraw the
textures or icons from the written descriptions in these READMEs — that is how
you end up with cartoon trees instead of engraved ones. The prose specs exist to
explain *why* things are the way they are and to give you the data model; the
static files are the ground truth for how it looks.

**`BUILD-CHECKLIST.md`** is the shortest path from here to a finished build. Start
there if you want a task list rather than a spec.

## Then read these

1. **`README-board.md`** — the game board. Hex grid math, all 215 tiles, 39
   cities, scoring track, action table, year track, legend, company plates.
2. **`README-pieces.md`** — the pieces. Player locomotives, year marker, company
   cubes, company share cards, house tokens.

## Everything in this bundle

### Use these to build

| File | What it is |
|---|---|
| `BUILD-CHECKLIST.md` | Ordered task list, acceptance criteria, open questions |
| `board-static.svg` | **The board, fully resolved.** Use this; don't redraw |
| `board-static.html` | The same SVG in a page with fonts loaded — open to view |
| `pieces-static.html` | **The pieces, fully resolved.** Open to view |
| `board-data.json` | **Authoritative board data** — grid, 215 tiles, 39 cities, all 100 scoring cells, every panel coordinate, map labels, city mark offsets, fonts |
| `pieces-data.json` | **Authoritative piece data** — every colour, size and outline path for all five piece types |

### Read these for context

| File | What it is |
|---|---|
| `README-board.md` | Board spec — data model and rationale |
| `README-pieces.md` | Pieces spec |
| `board-render.png` | 3042 × 2506 render of the board — visual target |
| `pieces-render.png` | 2880 × 5360 render of the pieces sheet — visual target |

### Original sources (probably ignore)

| File | What it is |
|---|---|
| `American Rails Board.dc.html` | Board design source — a template, see below |
| `American Rails Pieces.dc.html` | Pieces design source — a template, see below |
| `support.js` | Runtime the two `.dc.html` files need in order to render |

## Two things to know before you start

**The `.dc.html` files are templates, not drawings.** Their source is `{{ }}`
placeholders, repeat elements, and JavaScript that computes tile positions,
terrain textures and engraving hatch lines at load time. Read as text they look
like machinery. You want the static files instead — they are those templates
already executed and flattened.

**The JSON files are data, not reference.** Every tile position, terrain type,
city name, value, scoring cell and panel coordinate is already computed. Never
re-derive the hex geometry or read the map from an image.

## One note on the static SVG

`board-static.svg` uses internal `<use>` references for the four hex types and the
small repeated glyphs (skyline, rail ties, port marker, action-table icons), and
tiling `<pattern>` elements for the four terrain textures. All of it is defined in
the same file's `<defs>` — nothing external, and every fill is declared inside the
definitions, so it renders correctly anywhere SVG is supported.

If you are porting into something that does not follow `<use>` (some importers
and canvas paths), expand the 304 references against `<defs>` first rather than
substituting your own shapes. `pieces-static.html` has already had this expansion
done, so you can see what the flattened form looks like.

**`board-data.json` is data, not reference.** Every tile position, terrain type,
city name and value is already computed there. Never re-derive the hex geometry
or read the map from an image.

## Shared design language

Both deliverables use the same palette and type, so build the tokens once.

| Token | Value |
|---|---|
| Parchment | `#e7d7b3` |
| Panel fill | `#f4ecd6` |
| Rule / label brown | `#5d4726` |
| Heading ink | `#2b2013` |
| Body ink | `#3d2e1d` |
| Hex / piece stroke | `#33271b` |

**Typography** — Cinzel for titles, numbers and labels; EB Garamond for names,
values and body text. Both from Google Fonts.

**Company colours** are identical across the board's plates, the cubes, and the
share cards:

| Company | Colour |
|---|---|
| American | `#efe9dc` |
| National | `#b6b1a5` |
| Continental | `#3d7a46` |
| Majestic | `#dcb62c` |
| Liberty | `#b4382e` |
| Republic | `#2f6fae` |

## Open items across both

1. Company plate artwork on the board — six empty wells wanting locomotive
   illustrations
2. Share-card illustrations — procedural line placeholders, not real engravings
3. Map ornament — the physical board has coastline hatching, rivers, state lines
   and many small place names; this design uses clean parchment
4. Confirm the board's leftmost hex column and the 88 × 62 mm share-card size
   against the physical components

No AI-generated illustration art was used anywhere. Every mark is vector
geometry.
