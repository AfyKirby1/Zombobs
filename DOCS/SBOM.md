# Software Bill of Materials (SBOM)

This document lists all external dependencies, packages, and libraries used in the Zombie Survival Game project.

## External Dependencies

### Google Fonts
- **Creepster** - Horror-themed display font
  - Source: Google Fonts API
  - Usage: Game title and headers
  - Loaded via: `https://fonts.googleapis.com/css2?family=Creepster`
  - Last Updated: Project inception

- **Roboto Mono** - Monospaced font
  - Source: Google Fonts API
  - Usage: UI text, HUD elements, body text
  - Loaded via: `https://fonts.googleapis.com/css2?family=Roboto+Mono`
  - Last Updated: Project inception

## Core Technologies (Built-in, No Installation Required)

### Browser APIs
- **HTML5 Canvas API** - 2D rendering engine
  - Standard browser API, no installation needed
  - Used for game graphics rendering

- **Web Audio API** - Sound generation
  - Standard browser API, no installation needed
  - Used for programmatic sound generation (gunshots, damage, footsteps, restart sounds)

- **LocalStorage API** - Data persistence
  - Standard browser API, no installation needed
  - Used for high score tracking

### JavaScript Runtime
- **Vanilla JavaScript (ES6+)** - Core programming language
  - No transpilation or build tools required
  - Runs directly in modern browsers

### HTML/CSS
- **HTML5** - Markup language
- **CSS3** - Styling language

## Package Management

**No package manager or dependencies required.**

This project is intentionally dependency-free for simplicity (following KISS principle). All code is self-contained in a single HTML file (`zombie-game.html`).

## Security Notes

- All external resources are loaded from Google Fonts (HTTPS)
- No npm packages, CDN scripts, or third-party libraries are used
- No external data is sent or received (except font loading from Google)
- LocalStorage is used only for high score persistence (client-side only)

## Update History

- **2024** - Initial SBOM creation
- Project uses zero external packages - pure vanilla JavaScript implementation

---

**Last Audited**: 2024

