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

- **HTML5 Gamepad API** - Controller input
  - Standard browser API, no installation needed
  - Used for Xbox controller and other gamepad support
  - Enables analog stick movement and aiming

- **LocalStorage API** - Data persistence
  - Standard browser API, no installation needed
  - Used for high score tracking and settings persistence

### JavaScript Runtime
- **Vanilla JavaScript (ES6+)** - Core programming language
  - No transpilation or build tools required
  - Runs directly in modern browsers

### HTML/CSS
- **HTML5** - Markup language
- **CSS3** - Styling language

## Server Dependencies (Node.js)

### Backend Server (`server/`)
- **Express** v4.18.2 - HTTP server framework for serving static files
  - Source: npm registry
  - Usage: Static file serving and HTTP server
  - Last Updated: 2024 (multiplayer setup)

- **socket.io** v4.6.1 - WebSocket library for real-time multiplayer communication
  - Source: npm registry
  - Usage: Client-server WebSocket connections for multiplayer functionality (server + served client bundle)
  - Last Updated: 2024 (multiplayer setup)

## Package Management

**Frontend:** No package manager or dependencies required (vanilla JavaScript).

**Backend:** Node.js and npm required. Dependencies managed via `server/package.json`.

The frontend game code is intentionally dependency-free for simplicity (following KISS principle). The backend server is minimal and lightweight.

## Security Notes

- All external resources are loaded from Google Fonts (HTTPS)
- Frontend uses no npm packages or CDN scripts (except Google Fonts)
- Backend server dependencies (Express, socket.io) are standard, well-maintained packages
- No external data is sent or received (except font loading from Google and multiplayer WebSocket connections)
- LocalStorage is used only for high score persistence (client-side only)

## Update History

- **2024** - Initial SBOM creation
- **2024** - Added server dependencies (Express, socket.io) for multiplayer functionality
- **2025-11-19** - Added HTML5 Gamepad API to browser APIs section

---

**Last Audited**: 2025-11-19

