# Zombobs Style Guide & Design System

## 1. Design Philosophy
**"Retro-Future Arcade Horror"**

Zombobs combines the raw, pixel-perfect feel of classic arcade shooters with modern web aesthetics. The design language balances "gritty survival" with "slick, high-tech interface".

- **Core Pillars**: Dark, Neon, Glitch, Glass.
- **Atmosphere**: Oppressive darkness punctuated by vibrant, dangerous lights.

## 2. Color Palette

### Primary Colors
| Role | Color | Hex | CSS Variable | Usage |
|------|-------|-----|--------------|-------|
| **Deep Dark** | ![#02040a](https://placehold.co/15x15/02040a/02040a.png) | `#02040a` | `--bg-start` | Main background gradient start |
| **Abyssal Green** | ![#051b1f](https://placehold.co/15x15/051b1f/051b1f.png) | `#051b1f` | `--bg-end` | Main background gradient end |
| **Blood Red** | ![#ff1744](https://placehold.co/15x15/ff1744/ff1744.png) | `#ff1744` | `--accent` | Primary actions, health, danger |
| **Soft Red** | ![#ff5252](https://placehold.co/15x15/ff5252/ff5252.png) | `#ff5252` | `--accent-soft` | Glows, gradients, secondary highlights |

### Neutral / UI Colors
| Role | Color | Hex | CSS Variable | Usage |
|------|-------|-----|--------------|-------|
| **Text Main** | ![#f5f5f5](https://placehold.co/15x15/f5f5f5/f5f5f5.png) | `#f5f5f5` | `--text-main` | Primary headers, body text |
| **Text Muted** | ![#9e9e9e](https://placehold.co/15x15/9e9e9e/9e9e9e.png) | `#9e9e9e` | `--text-muted` | Metadata, labels, secondary info |
| **Glass Card** | ![#0a0c10](https://placehold.co/15x15/0a0c10/0a0c10.png) | `rgba(10, 12, 16, 0.65)` | `--card-bg` | Panel backgrounds (needs blur) |
| **Border** | ![#ffffff](https://placehold.co/15x15/ffffff/ffffff.png) | `rgba(255, 255, 255, 0.08)` | `--card-border` | Subtle outlining |

## 3. Typography

### Headings & Branding
**Font**: `Creepster`
**Usage**: Game Title, specific dramatic headers.
**Styling**:
- Heavy text-shadows for glow effect.
- Vertical gradients often applied via `background-clip: text`.

```css
font-family: 'Creepster', system-ui;
text-shadow: 0 0 15px rgba(255, 23, 68, 0.8);
```

### Interface & Body
**Font**: `'Roboto Mono', monospace`
**Usage**: UI elements, body text, code snippets, buttons.
**Rationale**: Reinforces the "tech/prototype" aesthetic.

## 4. UI Components

### Cards (Glassmorphism)
Containers use a frosted glass effect to separate content from the animated background.

```css
background: var(--card-bg);
backdrop-filter: blur(16px) saturate(120%);
-webkit-backdrop-filter: blur(16px) saturate(120%);
border: 1px solid var(--card-border);
border-radius: 18px;
```

### Buttons (Primary)
High-visibility call-to-action elements.

- **Shape**: Full rounded pills (`border-radius: 999px`).
- **Style**: Radial/Linear gradient background.
- **Effect**: "Pulse" animation on shadow to suggest energy.

### Pills / Tags
Used for metadata and quick info.

- **Style**: Outlined, low opacity background.
- **Interaction**: Slight glow and opacity increase on hover.

## 5. Visual Effects (FX)

### Noise Overlay
A global grain effect applied to the viewport to reduce banding and add texture.

```css
.noise-overlay {
    mix-blend-mode: overlay;
    opacity: 0.15;
    pointer-events: none;
    /* Uses SVG filter or noise image */
}
```

### Animations
- **`fadeInUp`**: Standard entrance animation for cards (opacity 0->1, Y-translation).
- **`pulse-glow`**: Breathing effect for key interactive elements.

## 6. Game Canvas Rendering
*Styling implemented via Canvas API Context 2D*

- **Zombies**: Radial gradients for "toxic aura" and body.
- **Projectiles**: High contrast cores (white/yellow) with colored outer glows.
- **Lighting**: Additive blending (implicit in some particle effects) and radial gradient overlays for vignettes.

