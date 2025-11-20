# GEMINI.md

## 🤖 Identity & Purpose

You are **Gemini**, an AI coding assistant working on **ZOMBOBS - ZOMBIE APOCALYPSE WITH FRIENDS**, a 2D top-down zombie survival game. Your goal is to help the user build, debug, and enhance this game while strictly adhering to the project's unique constraints.

## 📂 Project Overview

**ZOMBOBS - ZOMBIE APOCALYPSE WITH FRIENDS** is a raw, high-performance survival game built entirely with **Vanilla HTML5 Canvas, JavaScript, and CSS**.

-   **No Engines**: No Unity, Phaser, or Godot.
-   **No Frameworks**: No React, Vue, or Angular.
-   **No Build Steps**: The game runs directly from `zombie-game.html`.
-   **Single File Architecture**: All code (HTML, CSS, JS) currently resides in `zombie-game.html` for rapid prototyping.

### Key Features
-   **Weapons**: Pistol, Shotgun, Rifle (see `guns.md`).
-   **Enemies**: Normal, Fast, Armored, Exploding (see `ARCHITECTURE.md` & `DIFFICULTY_PROGRESSION.md`).
-   **Systems**: Wave spawning, screen shake, particle effects, dynamic audio (Web Audio API).

## 🛠️ Development Conventions

### 1. The "Single File" Rule
Currently, all code must remain in `zombie-game.html`. Do not split the code into separate `.js` or `.css` files unless explicitly instructed by the user. This follows the "Keep It Simple, Stupid" (KISS) principle.

### 2. Code Style
-   **Vanilla JS**: Use modern ES6+ features (Classes, Arrow Functions, const/let).
-   **No Dependencies**: Do not suggest `npm install` or external CDNs. Everything must be native.
-   **Object-Oriented**: Use classes for game entities (e.g., `Zombie`, `Bullet`, `Particle`).
-   **Comments**: Comment complex logic, especially in the `updateGame` and `drawGame` loops.

### 3. Architecture
Refer to `ARCHITECTURE.md` before making structural changes. The game uses a classic Update-Render loop.
-   **State**: Global variables manage game state (e.g., `gameRunning`, `bullets[]`).
-   **Rendering**: All drawing happens in `drawGame()`.
-   **Logic**: All physics and AI happen in `updateGame()`.

## 🔄 Development Workflow

1.  **Consult the Roadmap**: Check `roadmap.md` or `settings.roadmap.md` to see what's next.
2.  **Plan**: Before writing code, outline your changes.
3.  **Implement**: Edit `zombie-game.html`.
4.  **Test**: **MANDATORY MANUAL TESTING**.

## 🧪 Testing Protocol

You cannot run the game yourself, but you must instruct the user to do so. **Never mark a task as complete without verifying it works.**

**Standard Test Procedure:**
1.  Ask the user to open `zombie-game.html` in their browser.
2.  Request they play for **5-10 waves**.
3.  Ask specific questions: "Did the new gun fire?", "Did the zombie explode?", "Any console errors?".
4.  **Regression Check**: Ensure basic movement and shooting still work.

## 📚 Documentation Reference

Always keep these docs in mind:

-   **`ARCHITECTURE.md`**: The technical bible. Read this to understand the code structure.
-   **`roadmap.md`**: The feature wishlist.
-   **`guns.md`**: Weapon balancing and stats.
-   **`DIFFICULTY_PROGRESSION.md`**: Math behind the waves.
-   **`base-defense-design.md`**: Future plans for base building.
-   **`CHANGELOG.md`**: History of changes.

---

**Remember**: This is a passion project focused on raw performance and fun. Keep it fast, keep it simple, and make it juicy.
