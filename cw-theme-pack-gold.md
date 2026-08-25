# Theme — "Pack Gold"

A custom theme generated for the CrazyWolves Community website. The ten preset
themes in the theme library (Ocean Depths, Golden Hour, Midnight Galaxy, etc.)
would all have overridden the approved brand identity, so this theme was
derived directly from **CrazyWolves Brand Guide v1.0** instead. The brand guide
remains the single source of truth; this file is its machine-readable form.

Implemented in `cw-theme.css` as CSS custom properties.

---

## Identity

| | |
|---|---|
| **Name** | Pack Gold |
| **Mood** | Confident dark UI. Gold used as a reward, never as wallpaper. |
| **Feels like** | Premium, competitive, tactical, community-driven |
| **Avoids** | Cyberpunk neon, cheap gold gradients, app-store bubbly rounding |

---

## Colour

### Primary

| Token | Hex | Role |
|---|---|---|
| `--color-black` | `#0B0B0A` | Page ground |
| `--color-gold` | `#D4A24E` | Headlines, accents, interactive states |
| `--color-charcoal` | `#1C1712` | Raised ground, panels |

### Secondary & accent

| Token | Hex | Role |
|---|---|---|
| `--color-amber` | `#B8752E` | Eyebrows, section numbering |
| `--color-bronze` | `#8C5A34` | Gradient origin, secondary borders |
| `--color-gold-light` | `#E8C078` | Hover state of gold |
| `--color-pack-green` | `#3E5B44` | Partnerships only |

### Neutrals & text

| Token | Hex | Role |
|---|---|---|
| `--color-offwhite` | `#F3EEE4` | Headings, high emphasis |
| `--color-body` | `#C9C2B4` | Body copy |
| `--color-muted` | `#9C927E` | Captions, meta |
| `--color-border` | `#2A241A` | Standard border |
| `--color-surface` | `#161310` | Card ground |

### System states

`--color-success #4C8B5B` · `--color-warning #D8A93B` · `--color-error #B4423A`

Status is never communicated by colour alone — every state carries a text label
and, where useful, a distinct dot shape (circle for live, rotated square for
upcoming, hollow ring for completed).

### Accessibility

Gold on Deep Black passes WCAG AA. Body copy sits in Off-White or Body Gray on
Black/Charcoal — **never gold**. Gold is reserved for headlines, accents and
interactive states. Amber text is never placed on a Bronze background.

---

## Typography

| Token | Family | Use |
|---|---|---|
| `--font-display` | Anton | Headlines, hero type, section titles |
| `--font-body` | Barlow | Paragraphs, UI copy, buttons |
| `--font-condensed` | Barlow Condensed | Schedules, stats, labels, prices, tags |

Scale is fluid via `clamp()`, so H1 resolves to 34px on mobile and 52px on
desktop without a separate mobile stylesheet. Body has a hard 16px floor;
condensed labels never drop below 12px.

| Token | Value |
|---|---|
| `--fs-hero` | `clamp(2.75rem, 7vw, 5.5rem)` |
| `--fs-h1` | `clamp(2.125rem, 4.6vw, 3.25rem)` |
| `--fs-h2` | `clamp(1.75rem, 3.2vw, 2rem)` |
| `--fs-body` | `1rem` |
| `--fs-label` | `0.75rem` |

---

## Spacing, layout, shape

- **Base unit** 8px — scale `8 / 16 / 24 / 32 / 48 / 64 / 96 / 128`
- **Container** 1200px content, 1440px full-bleed, 720px long-form measure
- **Gutter** 24px desktop, 20px mobile
- **Radius** cards 4px · buttons 2px · pills 999px (tags and badges only)
- **Shadows** deep, soft, neutral black — no coloured glow
- **Controls** 36 / 44 / 52px, with 44px as the minimum touch target

## Breakpoints

| Name | Range |
|---|---|
| mobile | 0–639 |
| tablet | 640–1023 |
| desktop | 1024–1439 |
| wide | 1440+ |

---

## Brand devices

Four reusable graphic devices, each expressed as a token or utility class so
they stay consistent everywhere:

1. **Hairline texture** (`--texture-hairline`) — faint diagonal lines over large
   dark areas; material without asset weight.
2. **Gold lighting** (`--glow-gold`) — a single soft radial source at 20%
   opacity. One source per composition, never two.
3. **Diamond divider** (`.divider`) — a thin gold rule converging on a rotated
   square. Echoes the shield without repeating the wolf silhouette.
4. **HUD brackets** (`.brackets`) — angular corner marks framing featured
   cards, drop banners and player portraits.

Gold gradients (`--gradient-gold`) are permitted only on thin dividers, button
hover and badge edges. Never as a large flat fill.

The left-accent-bar card pattern is deliberately **not** used, per the brand
guide, with one exception reserved for Discord announcement embeds.
