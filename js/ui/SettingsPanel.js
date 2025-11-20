import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { getMasterGainNode } from '../systems/AudioSystem.js';
import { inputSystem } from '../systems/InputSystem.js';

// Style constants matching Style Guide
const COLORS = {
    bgStart: '#02040a',
    bgEnd: '#051b1f',
    accent: '#ff1744',
    accentSoft: '#ff5252',
    cardBg: 'rgba(10, 12, 16, 0.9)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    textMain: '#f5f5f5',
    textMuted: '#9e9e9e',
    glassBg: 'rgba(10, 12, 16, 0.9)',
    glassBorder: 'rgba(255, 255, 255, 0.12)'
};

export class SettingsPanel {
    constructor(canvas, settingsManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.settingsManager = settingsManager;
        this.visible = false;
        this.currentView = 'main'; // main, controls, video
        this.draggingSlider = false;
        this.draggingSliderId = null;
        this.sliderX = 0;
        this.sliderY = 0;
        this.sliderWidth = 200;
        this.sliderHeight = 8;
        this.rebindingAction = null;
        this.sliderBounds = null;
        this.backButtonBounds = null;
        this.controlsButtonBounds = null;
        this.videoButtonBounds = null;
        this.videoControls = {};
        this.keybindButtons = {};
        
        this.controlMode = 'keyboard'; // 'keyboard' or 'gamepad'
        this.toggleButtonBounds = null;
    }

    draw(mouse) {
        if (!this.visible) return;

        // Dark overlay with slight red tint
        const overlayGradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, Math.max(this.canvas.width, this.canvas.height)
        );
        overlayGradient.addColorStop(0, 'rgba(2, 4, 10, 0.92)');
        overlayGradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
        this.ctx.fillStyle = overlayGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Panel background
        const panelWidth = 600; // Wider for controls
        const panelHeight = 500; // Taller to fit controls
        const panelX = (this.canvas.width - panelWidth) / 2;
        const panelY = (this.canvas.height - panelHeight) / 2;

        // Glass-morphism panel background
        this.ctx.fillStyle = COLORS.glassBg;
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

        // Panel border with subtle glow
        this.ctx.strokeStyle = COLORS.accent;
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.5)';
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.shadowBlur = 0;

        // Inner border for glass effect
        this.ctx.strokeStyle = COLORS.glassBorder;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(panelX + 1, panelY + 1, panelWidth - 2, panelHeight - 2);

        if (this.currentView === 'main') {
            this.drawMainView(panelX, panelY, panelWidth, panelHeight, mouse);
        } else if (this.currentView === 'controls') {
            this.drawControlsView(panelX, panelY, panelWidth, panelHeight, mouse);
        } else if (this.currentView === 'video') {
            this.drawVideoView(panelX, panelY, panelWidth, panelHeight, mouse);
        }
    }

    // Helper: Draw title with Creepster font and glow
    drawTitle(text, x, y) {
        this.ctx.save();
        this.ctx.font = 'bold 36px "Creepster", cursive';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Glow effect
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
        
        // Gradient fill
        const gradient = this.ctx.createLinearGradient(x - 100, y - 20, x + 100, y + 20);
        gradient.addColorStop(0, COLORS.accentSoft);
        gradient.addColorStop(1, COLORS.accent);
        this.ctx.fillStyle = gradient;
        
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }

    // Helper: Draw button with glass-morphism and hover effects
    drawButton(x, y, width, height, text, isHovered, isActive = false) {
        this.ctx.save();
        
        // Button background
        if (isActive) {
            const bgGradient = this.ctx.createLinearGradient(x, y, x, y + height);
            bgGradient.addColorStop(0, COLORS.accentSoft);
            bgGradient.addColorStop(1, COLORS.accent);
            this.ctx.fillStyle = bgGradient;
        } else if (isHovered) {
            this.ctx.fillStyle = 'rgba(255, 23, 68, 0.4)';
        } else {
            this.ctx.fillStyle = 'rgba(255, 23, 68, 0.2)';
        }
        
        // Rounded corners approximation
        this.ctx.fillRect(x, y, width, height);
        
        // Border with glow on hover
        if (isHovered || isActive) {
            this.ctx.strokeStyle = COLORS.accent;
            this.ctx.lineWidth = 2;
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = 'rgba(255, 23, 68, 0.6)';
        } else {
            this.ctx.strokeStyle = COLORS.glassBorder;
            this.ctx.lineWidth = 1;
        }
        this.ctx.strokeRect(x, y, width, height);
        this.ctx.shadowBlur = 0;
        
        // Text
        this.ctx.fillStyle = COLORS.textMain;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = 'bold 16px "Roboto Mono", monospace';
        this.ctx.fillText(text, x + width / 2, y + height / 2);
        
        this.ctx.restore();
    }

    // Helper: Draw toggle switch
    drawToggle(x, y, width, height, isOn, isHovered) {
        this.ctx.save();
        
        // Toggle track
        const trackColor = isOn ? COLORS.accent : 'rgba(40, 40, 40, 0.8)';
        if (isHovered && !isOn) {
            this.ctx.fillStyle = 'rgba(60, 60, 60, 0.9)';
        } else {
            this.ctx.fillStyle = trackColor;
        }
        this.ctx.fillRect(x, y, width, height);
        
        // Border
        this.ctx.strokeStyle = isOn ? COLORS.accentSoft : COLORS.glassBorder;
        this.ctx.lineWidth = 1;
        if (isOn) {
            this.ctx.shadowBlur = 6;
            this.ctx.shadowColor = 'rgba(255, 23, 68, 0.4)';
        }
        this.ctx.strokeRect(x, y, width, height);
        this.ctx.shadowBlur = 0;
        
        // Toggle handle
        const handleSize = height - 6;
        const handleX = isOn ? x + width - handleSize - 3 : x + 3;
        const handleY = y + 3;
        
        // Handle glow when on
        if (isOn) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(handleX + handleSize / 2, handleY + handleSize / 2, handleSize / 2 + 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.fillStyle = COLORS.textMain;
        this.ctx.fillRect(handleX, handleY, handleSize, handleSize);
        
        this.ctx.restore();
    }

    // Helper: Draw slider with neon glow
    drawSlider(x, width, y, label, value, min, max, settingKey) {
        const settingX = x + 100;
        const sliderWidth = width - 200;
        
        // Label
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = COLORS.textMain;
        this.ctx.font = '14px "Roboto Mono", monospace';
        this.ctx.fillText(label, settingX, y);
        
        // Value
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = COLORS.textMuted;
        this.ctx.fillText(value, x + width - 100, y);

        const sliderY = y + 15;
        const sliderX = settingX;
        
        // Slider track background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.fillRect(sliderX, sliderY - 2, sliderWidth, 6);
        
        // Slider fill with gradient
        const normalized = (value - min) / (max - min);
        const fillWidth = sliderWidth * normalized;
        
        if (fillWidth > 0) {
            const fillGradient = this.ctx.createLinearGradient(sliderX, sliderY, sliderX + fillWidth, sliderY);
            fillGradient.addColorStop(0, COLORS.accentSoft);
            fillGradient.addColorStop(1, COLORS.accent);
            this.ctx.fillStyle = fillGradient;
            this.ctx.fillRect(sliderX, sliderY - 2, fillWidth, 6);
            
            // Glow effect on fill
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = 'rgba(255, 23, 68, 0.6)';
            this.ctx.fillRect(sliderX, sliderY - 2, fillWidth, 6);
            this.ctx.shadowBlur = 0;
        }
        
        // Slider handle with glow
        const handleX = sliderX + fillWidth;
        this.ctx.save();
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
        this.ctx.fillStyle = COLORS.textMain;
        this.ctx.beginPath();
        this.ctx.arc(handleX, sliderY + 1, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = COLORS.accent;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.restore();
        
        this.videoControls[`slider_${settingKey}`] = { 
            x: sliderX, y: sliderY - 7, width: sliderWidth, height: 20, 
            type: 'slider', min, max, value, setting: settingKey 
        };
    }

    drawMainView(x, y, width, height, mouse) {
        // Title with Creepster font
        this.drawTitle('SETTINGS', x + width / 2, y + 50);

        // Master Volume Setting
        const settingY = y + 100;
        const settingX = x + 130;
        const sliderWidth = width - 260;
        this.sliderWidth = sliderWidth;
        
        const volume = this.settingsManager.getSetting('audio', 'masterVolume');
        const volumePercent = Math.round(volume * 100);
        
        // Use improved slider helper
        const sliderY = settingY + 25;
        const sliderX = settingX;
        
        // Draw slider track background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.fillRect(sliderX, sliderY - 2, sliderWidth, 6);
        
        // Draw slider fill with gradient
        const fillWidth = sliderWidth * volume;
        if (fillWidth > 0) {
            const fillGradient = this.ctx.createLinearGradient(sliderX, sliderY, sliderX + fillWidth, sliderY);
            fillGradient.addColorStop(0, COLORS.accentSoft);
            fillGradient.addColorStop(1, COLORS.accent);
            this.ctx.fillStyle = fillGradient;
            this.ctx.fillRect(sliderX, sliderY - 2, fillWidth, 6);
            
            // Glow effect
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = 'rgba(255, 23, 68, 0.6)';
            this.ctx.fillRect(sliderX, sliderY - 2, fillWidth, 6);
            this.ctx.shadowBlur = 0;
        }
        
        // Slider handle with glow
        const handleX = sliderX + fillWidth;
        this.ctx.save();
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
        this.ctx.fillStyle = COLORS.textMain;
        this.ctx.beginPath();
        this.ctx.arc(handleX, sliderY + 1, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = COLORS.accent;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.restore();
        
        // Label
        this.ctx.font = '14px "Roboto Mono", monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = COLORS.textMain;
        this.ctx.fillText('Master Volume', settingX, settingY);
        
        // Value
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = COLORS.textMuted;
        this.ctx.fillText(`${volumePercent}%`, x + width - 130, settingY);

        this.sliderBounds = {
            x: sliderX,
            y: sliderY - 15,
            width: sliderWidth,
            height: 30
        };

        // Controls Button
        const controlsY = y + 170;
        const buttonWidth = 240;
        const buttonHeight = 50;
        const controlsX = x + (width - buttonWidth) / 2;
        
        const controlsMouseOver = mouse.x >= controlsX && mouse.x <= controlsX + buttonWidth &&
                                 mouse.y >= controlsY && mouse.y <= controlsY + buttonHeight;
        
        this.drawButton(controlsX, controlsY, buttonWidth, buttonHeight, 'Edit Controls', controlsMouseOver);
        
        this.controlsButtonBounds = {
            x: controlsX,
            y: controlsY,
            width: buttonWidth,
            height: buttonHeight
        };

        // Video Settings Button
        const videoY = controlsY + 70;
        const videoX = controlsX;

        const videoMouseOver = mouse.x >= videoX && mouse.x <= videoX + buttonWidth &&
                               mouse.y >= videoY && mouse.y <= videoY + buttonHeight;

        this.drawButton(videoX, videoY, buttonWidth, buttonHeight, 'Video Settings', videoMouseOver);

        this.videoButtonBounds = {
            x: videoX,
            y: videoY,
            width: buttonWidth,
            height: buttonHeight
        };

        this.drawBackButton(x, y, width, height, mouse);
    }

    drawControlsView(x, y, width, height, mouse) {
        // Title with Creepster font
        this.drawTitle('CONTROLS', x + width / 2, y + 40);
        
        // Toggle Button (Keyboard / Controller)
        const toggleWidth = 300;
        const toggleHeight = 36;
        const toggleX = x + (width - toggleWidth) / 2;
        const toggleY = y + 70;
        
        // Toggle Background with glass effect
        this.ctx.fillStyle = COLORS.glassBg;
        this.ctx.fillRect(toggleX, toggleY, toggleWidth, toggleHeight);
        this.ctx.strokeStyle = COLORS.glassBorder;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(toggleX, toggleY, toggleWidth, toggleHeight);
        
        // Active Selection with gradient
        const activeX = this.controlMode === 'keyboard' ? toggleX : toggleX + toggleWidth / 2;
        const activeGradient = this.ctx.createLinearGradient(activeX, toggleY, activeX, toggleY + toggleHeight);
        activeGradient.addColorStop(0, COLORS.accentSoft);
        activeGradient.addColorStop(1, COLORS.accent);
        this.ctx.fillStyle = activeGradient;
        this.ctx.fillRect(activeX, toggleY, toggleWidth / 2, toggleHeight);
        
        // Glow on active
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.5)';
        this.ctx.strokeStyle = COLORS.accent;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(activeX, toggleY, toggleWidth / 2, toggleHeight);
        this.ctx.shadowBlur = 0;
        
        // Text
        this.ctx.font = 'bold 14px "Roboto Mono", monospace';
        this.ctx.textBaseline = 'middle';
        this.ctx.textAlign = 'center';
        
        this.ctx.fillStyle = this.controlMode === 'keyboard' ? COLORS.textMain : COLORS.textMuted;
        this.ctx.fillText('KEYBOARD', toggleX + toggleWidth / 4, toggleY + toggleHeight / 2);
        
        this.ctx.fillStyle = this.controlMode === 'gamepad' ? COLORS.textMain : COLORS.textMuted;
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
            this.ctx.fillStyle = COLORS.textMuted;
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
            
            // Use drawButton helper for consistency
            if (isRebinding) {
                // Special styling for rebinding state
                const rebindGradient = this.ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnHeight);
                rebindGradient.addColorStop(0, COLORS.accentSoft);
                rebindGradient.addColorStop(1, COLORS.accent);
                this.ctx.fillStyle = rebindGradient;
                this.ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
                this.ctx.strokeStyle = COLORS.textMain;
                this.ctx.lineWidth = 2;
                this.ctx.shadowBlur = 12;
                this.ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
                this.ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);
                this.ctx.shadowBlur = 0;
            } else {
                this.drawButton(btnX, btnY, btnWidth, btnHeight, keyName, mouseOver);
            }
            
            // Button Text
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = COLORS.textMain;
            this.ctx.font = 'bold 13px "Roboto Mono", monospace';
            this.ctx.fillText(isRebinding ? 'Press...' : keyName, btnX + btnWidth / 2, btnY + btnHeight / 2);
            
            this.keybindButtons[key] = {
                x: btnX,
                y: btnY,
                width: btnWidth,
                height: btnHeight
            };
        });
        
        // Scroll Wheel Toggle (only show for keyboard mode)
        if (this.controlMode === 'keyboard') {
            const toggleY = startY + Math.ceil(keys.length / 2) * 45;
            const toggleLabelX = col1X;
            const toggleLabelY = toggleY + 15;
            
            // Label
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = COLORS.textMuted;
            this.ctx.font = '14px "Roboto Mono", monospace';
            this.ctx.fillText('Scroll Wheel Switch', toggleLabelX, toggleLabelY);
            
            // Toggle
            const toggleWidth = 50;
            const toggleHeight = 26;
            const toggleX = toggleLabelX + 120;
            const toggleButtonY = toggleY;
            
            const isOn = this.settingsManager.getSetting('controls', 'scrollWheelSwitch') ?? true;
            const isHover = mouse.x >= toggleX && mouse.x <= toggleX + toggleWidth &&
                            mouse.y >= toggleButtonY && mouse.y <= toggleButtonY + toggleHeight;
            
            this.drawToggle(toggleX, toggleButtonY, toggleWidth, toggleHeight, isOn, isHover);
            
            this.keybindButtons['scrollWheelSwitch'] = {
                x: toggleX,
                y: toggleButtonY,
                width: toggleWidth,
                height: toggleHeight,
                isToggle: true
            };
        }
        
        this.drawBackButton(x, y, width, height, mouse);
    }

    drawVideoView(x, y, width, height, mouse) {
        // Title with Creepster font
        this.drawTitle('VIDEO SETTINGS', x + width / 2, y + 50);

        this.videoControls = {};
        let currentY = y + 100;
        const centerX = x + width / 2;

        // Presets
        this.ctx.font = '14px "Roboto Mono", monospace';
        this.ctx.fillStyle = COLORS.textMain;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Quality Preset', centerX, currentY);
        
        currentY += 30;
        const presets = ['low', 'medium', 'high'];
        const presetWidth = 80;
        const presetHeight = 30;
        const totalPresetWidth = presets.length * (presetWidth + 10) - 10;
        let startX = centerX - totalPresetWidth / 2;

        const currentPreset = this.settingsManager.getSetting('video', 'qualityPreset');

        presets.forEach((preset, index) => {
            const btnX = startX + index * (presetWidth + 10);
            const btnY = currentY;
            
            const isSelected = currentPreset === preset;
            const isHover = mouse.x >= btnX && mouse.x <= btnX + presetWidth &&
                            mouse.y >= btnY && mouse.y <= btnY + presetHeight;

            this.drawButton(btnX, btnY, presetWidth, presetHeight, preset.toUpperCase(), isHover, isSelected);

            this.videoControls[`preset_${preset}`] = { x: btnX, y: btnY, width: presetWidth, height: presetHeight, type: 'preset', value: preset };
        });

        currentY += 60;

        // Particle Count Slider (using improved helper)
        const particleCount = this.settingsManager.getSetting('video', 'particleCount');
        this.drawSlider(x, width, currentY, 'Max Particles', particleCount, 50, 500, 'particleCount');
        currentY += 60;

        // Toggles
        const toggles = [
            { label: 'Vignette', key: 'vignette' },
            { label: 'Shadows', key: 'shadows' },
            { label: 'Lighting', key: 'lighting' },
            { label: 'Low Health Warning', key: 'lowHealthWarning' },
            { label: 'Floating Text', key: 'floatingText' },
            { label: 'Dynamic Crosshair', key: 'dynamicCrosshair' },
            { label: 'Enemy Health Bars', key: 'enemyHealthBars' },
            { label: 'Reload Bar', key: 'reloadBar' }
        ];

        toggles.forEach((toggle) => {
            const isOn = this.settingsManager.getSetting('video', toggle.key);
            
            this.ctx.textAlign = 'left';
            this.ctx.fillStyle = COLORS.textMain;
            this.ctx.font = '14px "Roboto Mono", monospace';
            this.ctx.fillText(toggle.label, x + 100, currentY + 15);

            const toggleWidth = 50;
            const toggleHeight = 26;
            const toggleX = x + width - 150;
            
            const isHover = mouse.x >= toggleX && mouse.x <= toggleX + toggleWidth &&
                            mouse.y >= currentY && mouse.y <= currentY + toggleHeight;

            this.drawToggle(toggleX, currentY, toggleWidth, toggleHeight, isOn, isHover);

            this.videoControls[`toggle_${toggle.key}`] = { x: toggleX, y: currentY, width: toggleWidth, height: toggleHeight, type: 'toggle', key: toggle.key };

            currentY += 40;
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
        
        this.drawButton(btnX, btnY, btnWidth, btnHeight, 'Back', mouseOver);
        
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
            
            if (this.currentView === 'main') {
                this.close();
            } else {
                this.currentView = 'main';
            }
            return true;
        }

        if (this.currentView === 'main') {
            // Slider
            if (this.sliderBounds &&
                x >= this.sliderBounds.x && x <= this.sliderBounds.x + this.sliderBounds.width &&
                y >= this.sliderBounds.y && y <= this.sliderBounds.y + this.sliderBounds.height) {
                this.draggingSlider = true;
                this.draggingSliderId = null; // Main volume slider has no ID
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

            // Video Button
            if (this.videoButtonBounds &&
                x >= this.videoButtonBounds.x && x <= this.videoButtonBounds.x + this.videoButtonBounds.width &&
                y >= this.videoButtonBounds.y && y <= this.videoButtonBounds.y + this.videoButtonBounds.height) {
                this.currentView = 'video';
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
                    // Handle toggle buttons (scrollWheelSwitch)
                    if (btn.isToggle) {
                        const currentValue = this.settingsManager.getSetting('controls', key) ?? true;
                        this.settingsManager.setSetting('controls', key, !currentValue);
                        return true;
                    }
                    // Regular keybind rebinding
                    this.startRebind(key);
                    return true;
                }
            }
        } else if (this.currentView === 'video') {
            for (const key in this.videoControls) {
                const ctrl = this.videoControls[key];
                if (x >= ctrl.x && x <= ctrl.x + ctrl.width && y >= ctrl.y && y <= ctrl.y + ctrl.height) {
                    if (ctrl.type === 'preset') {
                        this.settingsManager.applyVideoPreset(ctrl.value);
                    } else if (ctrl.type === 'toggle') {
                        this.settingsManager.setSetting('video', ctrl.key, !this.settingsManager.getSetting('video', ctrl.key));
                    } else if (ctrl.type === 'slider') {
                        this.draggingSlider = true;
                        this.draggingSliderId = ctrl.setting;
                        this.updateVideoSlider(x, ctrl);
                    }
                    return true;
                }
            }
        }

        return false;
    }

    handleMouseMove(x, y) {
        if (!this.visible) return;
        
        if (this.draggingSlider) {
            if (this.currentView === 'main') {
                this.updateSlider(x);
            } else if (this.currentView === 'video' && this.draggingSliderId) {
                const ctrlKey = `slider_${this.draggingSliderId}`;
                const ctrl = this.videoControls[ctrlKey];
                if (ctrl) this.updateVideoSlider(x, ctrl);
            }
        }
    }

    handleMouseUp() {
        this.draggingSlider = false;
        this.draggingSliderId = null;
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

    updateVideoSlider(x, ctrl) {
        const relativeX = x - ctrl.x;
        const percent = Math.max(0, Math.min(1, relativeX / ctrl.width));
        const value = Math.round(ctrl.min + percent * (ctrl.max - ctrl.min));
        this.settingsManager.setSetting('video', ctrl.setting, value);
    }

    open() {
        this.visible = true;
        this.currentView = 'main';
    }

    close() {
        this.visible = false;
        this.draggingSlider = false;
        this.draggingSliderId = null;
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
