import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { getMasterGainNode } from '../systems/AudioSystem.js';
import { inputSystem } from '../systems/InputSystem.js';

export class SettingsPanel {
    constructor(canvas, settingsManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.settingsManager = settingsManager;
        this.visible = false;
        this.currentView = 'main'; // main, controls
        this.draggingSlider = false;
        this.sliderX = 0;
        this.sliderY = 0;
        this.sliderWidth = 200;
        this.sliderHeight = 8;
        this.rebindingAction = null;
        this.sliderBounds = null;
        this.backButtonBounds = null;
        this.controlsButtonBounds = null;
        this.keybindButtons = {};
        
        this.controlMode = 'keyboard'; // 'keyboard' or 'gamepad'
        this.toggleButtonBounds = null;
    }

    draw(mouse) {
        if (!this.visible) return;

        // Dark overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Panel background
        const panelWidth = 600; // Wider for controls
        const panelHeight = 500; // Taller to fit controls
        const panelX = (this.canvas.width - panelWidth) / 2;
        const panelY = (this.canvas.height - panelHeight) / 2;

        // Panel background with gradient
        const bgGradient = this.ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
        bgGradient.addColorStop(0, 'rgba(42, 42, 42, 0.95)');
        bgGradient.addColorStop(1, 'rgba(26, 26, 26, 0.95)');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

        // Panel border
        this.ctx.strokeStyle = '#ff1744';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        if (this.currentView === 'main') {
            this.drawMainView(panelX, panelY, panelWidth, panelHeight, mouse);
        } else if (this.currentView === 'controls') {
            this.drawControlsView(panelX, panelY, panelWidth, panelHeight, mouse);
        }
    }

    drawMainView(x, y, width, height, mouse) {
        // Title
        this.ctx.font = 'bold 32px "Roboto Mono", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff1744';
        this.ctx.fillText('SETTINGS', x + width / 2, y + 50);

        // Master Volume Setting
        const settingY = y + 120;
        const settingX = x + 130;
        const sliderWidth = width - 260;
        this.sliderWidth = sliderWidth;
        
        // Label
        this.ctx.font = '16px "Roboto Mono", monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('Master Volume', settingX, settingY);

        // Value
        const volume = this.settingsManager.getSetting('audio', 'masterVolume');
        const volumePercent = Math.round(volume * 100);
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`${volumePercent}%`, x + width - 130, settingY);

        // Slider track
        const sliderY = settingY + 25;
        const sliderX = settingX;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(sliderX, sliderY - 4, sliderWidth, 8);

        // Slider fill
        this.ctx.fillStyle = '#ff1744';
        const fillWidth = sliderWidth * volume;
        this.ctx.fillRect(sliderX, sliderY - 4, fillWidth, 8);

        // Slider handle
        const handleX = sliderX + fillWidth;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(handleX, sliderY, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#ff1744';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.sliderBounds = {
            x: sliderX,
            y: sliderY - 15,
            width: sliderWidth,
            height: 30
        };

        // Controls Button
        const controlsY = y + 200;
        const buttonWidth = 240;
        const buttonHeight = 50;
        const controlsX = x + (width - buttonWidth) / 2;
        
        const mouseOver = mouse.x >= controlsX && mouse.x <= controlsX + buttonWidth &&
                         mouse.y >= controlsY && mouse.y <= controlsY + buttonHeight;
        
        this.ctx.fillStyle = mouseOver ? '#ff1744' : 'rgba(255, 23, 68, 0.3)';
        this.ctx.fillRect(controlsX, controlsY, buttonWidth, buttonHeight);
        this.ctx.strokeStyle = '#ff1744';
        this.ctx.strokeRect(controlsX, controlsY, buttonWidth, buttonHeight);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = 'bold 18px "Roboto Mono", monospace';
        this.ctx.fillText('Edit Controls', controlsX + buttonWidth / 2, controlsY + buttonHeight / 2);

        this.controlsButtonBounds = {
            x: controlsX,
            y: controlsY,
            width: buttonWidth,
            height: buttonHeight
        };

        this.drawBackButton(x, y, width, height, mouse);
    }

    drawControlsView(x, y, width, height, mouse) {
        // Title
        this.ctx.font = 'bold 32px "Roboto Mono", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff1744';
        this.ctx.fillText('CONTROLS', x + width / 2, y + 40);
        
        // Toggle Button (Keyboard / Controller)
        const toggleWidth = 300;
        const toggleHeight = 36;
        const toggleX = x + (width - toggleWidth) / 2;
        const toggleY = y + 70;
        
        // Toggle Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(toggleX, toggleY, toggleWidth, toggleHeight);
        this.ctx.strokeStyle = '#666';
        this.ctx.strokeRect(toggleX, toggleY, toggleWidth, toggleHeight);
        
        // Active Selection
        const activeX = this.controlMode === 'keyboard' ? toggleX : toggleX + toggleWidth / 2;
        this.ctx.fillStyle = '#ff1744';
        this.ctx.fillRect(activeX, toggleY, toggleWidth / 2, toggleHeight);
        
        // Text
        this.ctx.font = 'bold 14px "Roboto Mono", monospace';
        this.ctx.textBaseline = 'middle';
        this.ctx.textAlign = 'center';
        
        this.ctx.fillStyle = this.controlMode === 'keyboard' ? '#ffffff' : '#888888';
        this.ctx.fillText('KEYBOARD', toggleX + toggleWidth / 4, toggleY + toggleHeight / 2);
        
        this.ctx.fillStyle = this.controlMode === 'gamepad' ? '#ffffff' : '#888888';
        this.ctx.fillText('CONTROLLER', toggleX + 3 * toggleWidth / 4, toggleY + toggleHeight / 2);
        
        this.toggleButtonBounds = {
            x: toggleX,
            y: toggleY,
            width: toggleWidth,
            height: toggleHeight
        };
        
        const startY = y + 130;
        
        let controls;
        let labels;
        
        if (this.controlMode === 'keyboard') {
             controls = this.settingsManager.settings.controls;
             labels = {
                moveUp: 'Move Up',
                moveDown: 'Move Down',
                moveLeft: 'Move Left',
                moveRight: 'Move Right',
                sprint: 'Sprint',
                reload: 'Reload',
                grenade: 'Grenade',
                melee: 'Melee',
                weapon1: 'Pistol',
                weapon2: 'Shotgun',
                weapon3: 'Rifle'
            };
        } else {
            controls = this.settingsManager.settings.gamepad || {};
            labels = {
                fire: 'Fire',
                reload: 'Reload',
                grenade: 'Grenade',
                sprint: 'Sprint',
                melee: 'Melee',
                prevWeapon: 'Prev Weapon',
                nextWeapon: 'Next Weapon',
                pause: 'Pause',
                // interact: 'Interact'
            };
        }
        
        const col1X = x + 50;
        const col2X = x + width / 2 + 30;
        
        this.keybindButtons = {};
        const keys = Object.keys(labels);
        
        // Split into two columns
        const midPoint = Math.ceil(keys.length / 2);
        
        keys.forEach((key, index) => {
            const isSecondCol = index >= midPoint;
            const rowIndex = isSecondCol ? index - midPoint : index;
            const itemX = isSecondCol ? col2X : col1X;
            const itemY = startY + rowIndex * 45;
            
            // Label
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#cccccc';
            this.ctx.font = '14px "Roboto Mono", monospace';
            this.ctx.fillText(labels[key], itemX, itemY + 15);
            
            // Button
            const btnWidth = 100;
            const btnHeight = 30;
            const btnX = itemX + 120; // fixed offset from label
            const btnY = itemY;
            
            let keyName = '';
            if (this.controlMode === 'keyboard') {
                keyName = (controls[key] || '').toUpperCase();
            } else {
                keyName = this.getGamepadButtonName(controls[key]);
            }
            
            const isRebinding = this.rebindingAction === key;
            
            const mouseOver = mouse.x >= btnX && mouse.x <= btnX + btnWidth &&
                             mouse.y >= btnY && mouse.y <= btnY + btnHeight;
                             
            // Button BG
            if (isRebinding) {
                this.ctx.fillStyle = '#ff1744';
            } else {
                this.ctx.fillStyle = mouseOver ? 'rgba(255, 23, 68, 0.4)' : 'rgba(40, 40, 40, 0.8)';
            }
            this.ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
            this.ctx.strokeStyle = isRebinding ? '#ffffff' : (mouseOver ? '#ff1744' : '#666666');
            this.ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);
            
            // Button Text
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 14px "Roboto Mono", monospace';
            this.ctx.fillText(isRebinding ? 'Press...' : keyName, btnX + btnWidth / 2, btnY + btnHeight / 2);
            
            this.keybindButtons[key] = {
                x: btnX,
                y: btnY,
                width: btnWidth,
                height: btnHeight
            };
        });
        
        this.drawBackButton(x, y, width, height, mouse);
    }

    drawBackButton(x, y, width, height, mouse) {
        const btnWidth = 120;
        const btnHeight = 40;
        const btnX = x + (width - btnWidth) / 2;
        const btnY = y + height - 60;
        
        const mouseOver = mouse.x >= btnX && mouse.x <= btnX + btnWidth &&
                         mouse.y >= btnY && mouse.y <= btnY + btnHeight;
        
        this.ctx.fillStyle = mouseOver ? '#ff1744' : 'rgba(255, 23, 68, 0.3)';
        this.ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
        this.ctx.strokeStyle = '#ff1744';
        this.ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = '16px "Roboto Mono", monospace';
        this.ctx.fillText('Back', btnX + btnWidth / 2, btnY + btnHeight / 2);
        
        this.backButtonBounds = {
            x: btnX,
            y: btnY,
            width: btnWidth,
            height: btnHeight
        };
    }

    handleClick(x, y) {
        if (!this.visible) return false;
        
        // If rebinding, ignore other clicks unless it's a cancel mechanism
        if (this.rebindingAction) {
            // Could allow clicking to cancel?
            this.cancelRebind();
            return true;
        }

        // Check back button
        if (this.backButtonBounds && 
            x >= this.backButtonBounds.x && x <= this.backButtonBounds.x + this.backButtonBounds.width &&
            y >= this.backButtonBounds.y && y <= this.backButtonBounds.y + this.backButtonBounds.height) {
            
            if (this.currentView === 'controls') {
                this.currentView = 'main';
            } else {
                this.close();
            }
            return true;
        }

        if (this.currentView === 'main') {
            // Slider
            if (this.sliderBounds &&
                x >= this.sliderBounds.x && x <= this.sliderBounds.x + this.sliderBounds.width &&
                y >= this.sliderBounds.y && y <= this.sliderBounds.y + this.sliderBounds.height) {
                this.draggingSlider = true;
                this.updateSlider(x);
                return true;
            }
            
            // Controls Button
            if (this.controlsButtonBounds &&
                x >= this.controlsButtonBounds.x && x <= this.controlsButtonBounds.x + this.controlsButtonBounds.width &&
                y >= this.controlsButtonBounds.y && y <= this.controlsButtonBounds.y + this.controlsButtonBounds.height) {
                this.currentView = 'controls';
                return true;
            }
        } else if (this.currentView === 'controls') {
            // Toggle Button
            if (this.toggleButtonBounds &&
                x >= this.toggleButtonBounds.x && x <= this.toggleButtonBounds.x + this.toggleButtonBounds.width &&
                y >= this.toggleButtonBounds.y && y <= this.toggleButtonBounds.y + this.toggleButtonBounds.height) {
                
                const relativeX = x - this.toggleButtonBounds.x;
                if (relativeX < this.toggleButtonBounds.width / 2) {
                    this.controlMode = 'keyboard';
                } else {
                    this.controlMode = 'gamepad';
                }
                return true;
            }
            
            // Keybind buttons
            for (const key in this.keybindButtons) {
                const btn = this.keybindButtons[key];
                if (x >= btn.x && x <= btn.x + btn.width &&
                    y >= btn.y && y <= btn.y + btn.height) {
                    this.startRebind(key);
                    return true;
                }
            }
        }

        return false;
    }

    handleMouseMove(x, y) {
        if (!this.visible) return;
        
        if (this.draggingSlider) {
            this.updateSlider(x);
        }
    }

    handleMouseUp() {
        this.draggingSlider = false;
    }

    updateSlider(x) {
        if (!this.sliderBounds) return;
        
        const relativeX = x - this.sliderBounds.x;
        const value = Math.max(0, Math.min(1, relativeX / this.sliderWidth));
        this.settingsManager.setSetting('audio', 'masterVolume', value);
        
        // Apply volume change immediately
        const masterGainNode = getMasterGainNode();
        if (masterGainNode) {
            masterGainNode.gain.value = value;
        }
    }

    open() {
        this.visible = true;
        this.currentView = 'main';
    }

    close() {
        this.visible = false;
        this.draggingSlider = false;
        this.rebindingAction = null;
        this.controlMode = 'keyboard';
        // Check if inputSystem has a pending rebind and cancel it
        inputSystem.cancelRebind();
        gameState.showSettingsPanel = false;
    }
    
    startRebind(action) {
        this.rebindingAction = action;
        
        if (this.controlMode === 'gamepad') {
             inputSystem.startRebind((buttonIndex) => {
                 this.handleGamepadRebind(buttonIndex);
             });
        }
    }
    
    cancelRebind() {
        this.rebindingAction = null;
        if (this.controlMode === 'gamepad') {
            inputSystem.cancelRebind();
        }
    }
    
    handleRebind(key) {
        if (!this.rebindingAction || this.controlMode !== 'keyboard') return;
        
        // Prevent binding Escape
        if (key === 'Escape') {
            this.cancelRebind();
            return;
        }
        
        const lowerKey = key.toLowerCase();
        this.settingsManager.setSetting('controls', this.rebindingAction, lowerKey);
        this.rebindingAction = null;
    }
    
    handleGamepadRebind(buttonIndex) {
        if (!this.rebindingAction || this.controlMode !== 'gamepad') return;
        
        this.settingsManager.setSetting('gamepad', this.rebindingAction, buttonIndex);
        this.rebindingAction = null;
    }
    
    getGamepadButtonName(index) {
        const names = [
            'A', 'B', 'X', 'Y', 
            'LB', 'RB', 'LT', 'RT', 
            'View', 'Menu', 'L3', 'R3', 
            'D-Up', 'D-Down', 'D-Left', 'D-Right'
        ];
        return names[index] !== undefined ? names[index] : `Btn ${index}`;
    }
}
