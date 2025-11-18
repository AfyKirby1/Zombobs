# Base Defense System Design Document

## Overview
The Base Defense System introduces a central base with four protective walls that the player must defend against zombie attacks. This feature adds a strategic layer to the gameplay, requiring players to balance offensive zombie hunting with defensive base maintenance.

## Core Components

### 1. Base Perimeter Walls
- **Position**: Four walls positioned at the edges of the map (top, right, bottom, left)
- **Visual Design**: Solid barriers with distinct coloring to differentiate from the environment
- **Dimensions**: Each wall will span the full length of its respective side
- **Function**: Serve as the first line of defense against zombie incursions

### 2. Wall Health System
- **Health Points**: Each wall starts with 100 HP
- **Damage Mechanism**: Zombies attacking walls will reduce their HP
- **Visual Feedback**: 
  - Walls change color based on health (green → yellow → red)
  - Health bars displayed above each wall
  - Cracks and damage effects appear as health decreases
- **Failure State**: When a wall reaches 0 HP, zombies can pass through that section

### 3. Wall Repair Mechanic
- **Activation**: Player must approach a damaged wall and press a key (E or F)
- **Repair Process**: 
  - Takes 2-3 seconds to complete
  - Player cannot move or attack during repair
  - Visual indicator shows repair progress
- **Resource Cost**: Repairing costs 10 materials (collected from zombies)
- **Repair Amount**: Restores 25% of wall's maximum health per repair

### 4. Wall Upgrades
- **Upgrade Tiers**: 
  - Tier 1: Basic wall (100 HP)
  - Tier 2: Reinforced wall (150 HP, 10% damage reduction)
  - Tier 3: Fortified wall (200 HP, 20% damage reduction)
- **Upgrade Cost**: Materials collected from defeated zombies
- **Upgrade Process**: Stand near wall and press upgrade key when materials are available
- **Visual Changes**: Each tier has distinct visual appearance

### 5. Gate Mechanism
- **Location**: Center of each wall
- **Function**: Allows player passage while blocking zombies
- **Control**: 
  - Manual open/close with a key press
  - Auto-close after player passes through
  - Visual indicator shows gate status (open/closed)
- **Durability**: Gates have separate health from walls

## Implementation Details

### Wall Class Structure
```javascript
class Wall {
  constructor(side, x, y, width, height) {
    this.side = side; // 'top', 'right', 'bottom', 'left'
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.maxHealth = 100;
    this.currentHealth = 100;
    this.tier = 1;
    this.gateOpen = false;
    this.gateHealth = 50;
  }
  
  takeDamage(amount) {
    this.currentHealth -= amount;
    if (this.currentHealth <= 0) {
      this.currentHealth = 0;
      // Wall is breached
    }
  }
  
  repair() {
    const repairAmount = this.maxHealth * 0.25;
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + repairAmount);
  }
  
  upgrade() {
    if (this.tier < 3) {
      this.tier++;
      // Update maxHealth and other properties based on tier
    }
  }
}
```

### Integration with Existing Systems
- **Zombie AI**: Zombies will target walls when player is not nearby
- **Player Interaction**: New key bindings for repair and upgrade actions
- **Resource System**: Materials collected from zombies will be used for repairs/upgrades
- **UI Updates**: New HUD elements to display wall health and material count

## Player Experience
- **Strategic Decisions**: Choose between offensive and defensive play styles
- **Resource Management**: Balance spending materials on repairs vs. other upgrades
- **Risk/Reward**: Leaving walls unrepaired allows zombies to breach, but staying to repair means fewer kills
- **Progression**: Upgrading walls provides long-term benefits for survival

## Visual Design
- **Wall Appearance**: 
  - Tier 1: Basic wooden planks
  - Tier 2: Metal reinforcements
  - Tier 3: Concrete with steel plating
- **Damage Effects**: 
  - Cracks appear as health decreases
  - Color shifts from green to red
  - Particle effects for destruction
- **Repair Effects**: 
  - Glowing effect during repair
  - Sparks and welding visuals
  - Health bar fills as repair progresses

## Audio Design
- **Wall Damage**: Cracking and splintering sounds
- **Repair Process**: Hammering and construction sounds
- **Upgrade Process**: Mechanical and industrial sounds
- **Breach Event**: Dramatic sound when wall is destroyed

## Progression System
- **Early Game**: Focus on basic survival and learning mechanics
- **Mid Game**: Introduce wall management as key strategy
- **Late Game**: Maximize wall upgrades for end-game survival