# GEMINI.md

## Project Overview

This project is a 2D top-down zombie survival game. The game is built entirely with vanilla HTML5 Canvas, JavaScript, and CSS, with no external libraries or frameworks. The objective of the game is to survive as long as possible against waves of zombies that progressively increase in difficulty.

The game features:
- A variety of weapons with different characteristics.
- A wave-based system for zombie spawning.
- Visual effects such as screen shake, damage indicators, and particle effects.
- An in-game HUD to display player stats.

## Building and Running

The game is self-contained in the `zombie-game.html` file and requires no build process.

To run the game, simply open the `zombie-game.html` file in a modern web browser.

## Development Conventions

The project follows a "Keep It Simple, Stupid" (KISS) approach, with all the code (HTML, CSS, and JavaScript) in a single file for rapid prototyping.

The JavaScript code is structured in an object-oriented manner, with classes for key game entities:
- `GameHUD`: Renders the in-game heads-up display.
- `Bullet`: Represents projectiles fired by the player.
- `Zombie`: Represents the enemy characters.
- `Particle`: Used for visual effects like blood splatters.

The game loop is driven by `requestAnimationFrame` for smooth animations.

The project is well-documented, with the following files providing additional context:
- `ARCHITECTURE.md`: Describes the technical architecture of the game.
- `guns.md`: Details the different weapons available in the game.
- `roadmap.md`: Outlines planned features for the game.
- `CHANGELOG.md`: Tracks the version history of the project.
