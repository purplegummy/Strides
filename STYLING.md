# Strides Styling Guide

## Color Palette

### Backgrounds
| Role | Value | Usage |
|---|---|---|
| Base | `#0b1020` | Full-page backgrounds, map canvas |
| Surface | `#0F172A` | Cards, buttons, floating UI, avatar backgrounds |
| Elevated surface | `#1f2937` | Level badge, secondary indicators |

### Borders & Dividers
| Role | Value | Usage |
|---|---|---|
| Subtle border | `#656A73` at 40% opacity | Button outlines, input borders, dividers |
| Faint border | `white/10` | Sheet edges, overlays on dark glass |

### Text
| Role | Value | Usage |
|---|---|---|
| Primary | `#E6EDF7` | Headings, labels, body copy |
| Secondary | `#BFC8D9` | Subtitles, metadata, icon strokes |
| Muted | `white/60` | Hints, disabled states, secondary descriptions |

### Brand / Interactive
| Role | Value | Usage |
|---|---|---|
| Accent | `#38bdf8` | Focus rings, links, active indicators, user map marker, pin center |
| Accent dark | `#1d6fb0` | XP arc, gradient start (if gradients are used) |

### Semantic
| Role | Value | Usage |
|---|---|---|
| Danger | `#ff6060` | Delete confirmations, destructive actions only |
| Streak | `#ffb347` | Streak badges, warm highlights |
| Gold | `#ffd700` | Max-level / legendary states only |

### Pin Rarity (do not repurpose these)
| Rarity | Value |
|---|---|
| Common | `#8899aa` |
| Notable | `#4ade80` |
| Popular | `#38bdf8` |
| Rare | `#a78bfa` |
| Legendary | `#fbbf24` |

---

## Component Patterns

### Floating Map Buttons (compass, drop-pin, nav toggle)
```
rounded-full
bg-[#0F172A]
inset shadow: inset 0 3px 10px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(255,255,255,0.04), 0 4px 12px rgba(0,0,0,0.4)
icon color: #E6EDF7/80
```

### Dark Glass Buttons (bottom sheet actions, secondary controls)
```
rounded-2xl
border border-[#656A73]/40
bg-[#0F172A]/60
backdrop-blur
shadow-[0_12px_40px_rgba(0,0,0,0.55)]
hover: bg-[#0F172A]/75
active: scale-[0.98]
```

### Primary Action Button (form submit, create pin)
```
gradient: linear-gradient(135deg, #1d6fb0 0%, #38bdf8 100%)
rounded-xl (forms) or rounded-2xl (sheets)
text: white
```

### Ghost / Secondary Button (back, cancel, sign out)
```
bg-white/10
hover: bg-white/15
border: white/15 (optional)
text: white/90
rounded-xl or rounded-2xl
```

### Nav Nodes (expanded radial menu)
```
Same as Dark Glass Buttons above
Active state: bg-[#1d6fb0]/80, border-[#38bdf8]/50
icon color active: #E6EDF7
icon color inactive: #BFC8D9
```

---

## Rules

- **Never mix light and dark themes.** The login page (`bg-slate-200` / `#D0EAF5`) is intentionally isolated — do not use light backgrounds inside the app shell.
- **Buttons on the map** should all use the same `#0F172A` rounded-full style so they visually group with the profile button.
- **Gradients** are reserved for primary CTA buttons only (form submit, create pin submit). Do not use on map UI or nav elements.
- **Danger color** (`#ff6060`) is for destructive confirmation only — never use for general UI accents.
- **Gold / streak** colors are celebratory moments only — not general highlights.
- **Pin rarity colors** are a closed set. Do not reuse them for non-rarity UI.
- **Accent** (`#38bdf8`) is used for the user map marker, active indicators, and focus states. Keep it consistent so users associate it with "you / active."
