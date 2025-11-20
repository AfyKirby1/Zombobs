import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { updateAudioSettings } from '../systems/AudioSystem.js';
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
    glassBg: 'rgba(10, 12, 16, 0.95)',
    glassBorder: 'rgba(255, 255, 255, 0.12)'
};

export class SettingsPanel {
    constructor(canvas, settingsManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.settingsManager = settingsManager;
        this.visible = false;
        
        // Tabs
        this.activeTab = 'video'; // video, audio, gameplay, controls
        this.tabs = ['video', 'audio', 'gameplay', 'controls'];
        
        // Scrolling
        this.scrollY = 0;
        this.targetScrollY = 0;
        this.contentHeight = 0;
        this.viewportHeight = 0;
        this.scrollBarWidth = 6;
        
        // Interaction
        this.draggingSlider = false;
        this.draggingSliderId = null; // { category, key }
        this.draggingScrollBar = false;
        this.activeDropdown = null; // { category, key, options, x, y, width }
        this.rebindingAction = null;
        
        // Layout (Compact)
        this.panelX = 0;
        this.panelY = 0;
        this.panelWidth = 800;
        this.panelHeight = 650;
        this.padding = 20; // Reduced from 30
        this.tabHeight = 50;
        
        this.controls = []; // List of interactive elements for hit testing
    }

    open() {
        this.visible = true;
        this.scrollY = 0;
        this.targetScrollY = 0;
        this.activeDropdown = null;
        this.rebindingAction = null;
        this.activeTab = 'video'; // Reset to first tab
    }

    close() {
        this.visible = false;
        this.draggingSlider = false;
        this.draggingSliderId = null;
        this.draggingScrollBar = false;
        this.activeDropdown = null;
        this.rebindingAction = null;
        inputSystem.cancelRebind();
        gameState.showSettingsPanel = false;
    }

    draw(mouse) {
        if (!this.visible) return;

        // Update dimensions
        this.panelHeight = Math.min(700, this.canvas.height - 60);
        this.panelX = (this.canvas.width - this.panelWidth) / 2;
        this.panelY = (this.canvas.height - this.panelHeight) / 2;
        this.viewportHeight = this.panelHeight - 150; // Header/Tabs/Footer space

        // Smooth Scroll
        this.scrollY += (this.targetScrollY - this.scrollY) * 0.2;
        // Clamp scroll
        const maxScroll = Math.max(0, this.contentHeight - this.viewportHeight);
        if (this.targetScrollY < 0) this.targetScrollY = 0;
        if (this.targetScrollY > maxScroll) this.targetScrollY = maxScroll;
        
        // Clamp actual scroll for rendering (stops rubber banding visual)
        let renderScrollY = this.scrollY;
        if (renderScrollY < 0) renderScrollY = 0;
        if (renderScrollY > maxScroll) renderScrollY = maxScroll;

        this.controls = []; // Reset controls for this frame

        this.drawOverlay();
        this.drawPanelBackground();
        this.drawHeader();
        this.drawTabs(mouse);
        
        // Content Area with Clipping
        const contentStartY = this.panelY + 80 + this.tabHeight;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(this.panelX, contentStartY, this.panelWidth, this.viewportHeight);
        this.ctx.clip();

        let currentY = contentStartY - renderScrollY;

        // Render content based on active tab
        if (this.activeTab === 'video') {
            currentY = this.drawVideoSettings(currentY, mouse);
        } else if (this.activeTab === 'audio') {
            currentY = this.drawAudioSettings(currentY, mouse);
        } else if (this.activeTab === 'gameplay') {
            currentY = this.drawGameplaySettings(currentY, mouse);
        } else if (this.activeTab === 'controls') {
            currentY = this.drawControlsSettings(currentY, mouse);
        }

        this.contentHeight = currentY + renderScrollY - contentStartY + 30; // Total height + padding
        this.ctx.restore();

        this.drawScrollBar(renderScrollY, maxScroll, mouse);
        this.drawFooter(mouse);

        // Draw active dropdown on top if exists
        if (this.activeDropdown) {
            this.drawDropdownMenu(this.activeDropdown, mouse);
        }
    }

    drawOverlay() {
        const overlayGradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, Math.max(this.canvas.width, this.canvas.height)
        );
        overlayGradient.addColorStop(0, 'rgba(2, 4, 10, 0.92)');
        overlayGradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
        this.ctx.fillStyle = overlayGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawPanelBackground() {
        // Glass-morphism panel
        this.ctx.fillStyle = COLORS.glassBg;
        this.ctx.fillRect(this.panelX, this.panelY, this.panelWidth, this.panelHeight);

        this.ctx.strokeStyle = COLORS.accent;
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.5)';
        this.ctx.strokeRect(this.panelX, this.panelY, this.panelWidth, this.panelHeight);
        this.ctx.shadowBlur = 0;

        // Inner border
        this.ctx.strokeStyle = COLORS.glassBorder;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(this.panelX + 1, this.panelY + 1, this.panelWidth - 2, this.panelHeight - 2);
    }

    drawHeader() {
        this.ctx.save();
        this.ctx.font = 'bold 32px "Creepster", cursive';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Glow effect
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
        
        const gradient = this.ctx.createLinearGradient(this.panelX, this.panelY + 35, this.panelX + this.panelWidth, this.panelY + 35);
        gradient.addColorStop(0, COLORS.accentSoft);
        gradient.addColorStop(1, COLORS.accent);
        this.ctx.fillStyle = gradient;
        
        this.ctx.fillText("SETTINGS", this.panelX + this.panelWidth / 2, this.panelY + 35);
        this.ctx.restore();

        // Divider
        this.ctx.fillStyle = COLORS.glassBorder;
        this.ctx.fillRect(this.panelX + 20, this.panelY + 65, this.panelWidth - 40, 1);
    }

    drawTabs(mouse) {
        const tabY = this.panelY + 80;
        const tabWidth = this.panelWidth / this.tabs.length;
        
        this.tabs.forEach((tab, index) => {
            const tabX = this.panelX + index * tabWidth;
            const isActive = this.activeTab === tab;
            const isHovered = mouse.x >= tabX && mouse.x <= tabX + tabWidth &&
                              mouse.y >= tabY && mouse.y <= tabY + this.tabHeight;
            
            // Tab background
            if (isActive) {
                const activeGradient = this.ctx.createLinearGradient(tabX, tabY, tabX, tabY + this.tabHeight);
                activeGradient.addColorStop(0, 'rgba(255, 23, 68, 0.3)');
                activeGradient.addColorStop(1, 'rgba(255, 23, 68, 0.1)');
                this.ctx.fillStyle = activeGradient;
                this.ctx.fillRect(tabX, tabY, tabWidth, this.tabHeight);
                
                // Active tab border (top accent)
                this.ctx.fillStyle = COLORS.accent;
                this.ctx.fillRect(tabX, tabY, tabWidth, 3);
            } else if (isHovered) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                this.ctx.fillRect(tabX, tabY, tabWidth, this.tabHeight);
            }
            
            // Tab divider
            if (index > 0) {
                this.ctx.fillStyle = COLORS.glassBorder;
                this.ctx.fillRect(tabX, tabY + 10, 1, this.tabHeight - 20);
            }
            
            // Tab label
            this.ctx.font = isActive ? 'bold 14px "Roboto Mono", monospace' : '14px "Roboto Mono", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = isActive ? COLORS.textMain : COLORS.textMuted;
            
            if (isActive) {
                this.ctx.shadowBlur = 8;
                this.ctx.shadowColor = COLORS.accent;
            }
            
            this.ctx.fillText(tab.toUpperCase(), tabX + tabWidth / 2, tabY + this.tabHeight / 2);
            this.ctx.shadowBlur = 0;
            
            // Register tab as clickable control
            this.controls.push({
                type: 'tab',
                tab: tab,
                x: tabX, y: tabY, width: tabWidth, height: this.tabHeight
            });
        });
        
        // Bottom border
        this.ctx.fillStyle = COLORS.glassBorder;
        this.ctx.fillRect(this.panelX, tabY + this.tabHeight, this.panelWidth, 1);
    }

    drawFooter(mouse) {
        const btnWidth = 120;
        const btnHeight = 40;
        const btnX = this.panelX + (this.panelWidth - btnWidth) / 2;
        const btnY = this.panelY + this.panelHeight - 50;
        
        const isHovered = mouse.x >= btnX && mouse.x <= btnX + btnWidth &&
                         mouse.y >= btnY && mouse.y <= btnY + btnHeight;
        
        // Back Button background
        if (isHovered) {
            this.ctx.fillStyle = 'rgba(255, 23, 68, 0.4)';
            this.ctx.strokeStyle = COLORS.accent;
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = 'rgba(255, 23, 68, 0.6)';
        } else {
            this.ctx.fillStyle = 'rgba(255, 23, 68, 0.2)';
            this.ctx.strokeStyle = COLORS.glassBorder;
            this.ctx.shadowBlur = 0;
        }
        
        this.ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
        this.ctx.lineWidth = isHovered ? 2 : 1;
        this.ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);
        
        // Text
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = COLORS.textMain;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = 'bold 16px "Roboto Mono", monospace';
        this.ctx.fillText("BACK", btnX + btnWidth / 2, btnY + btnHeight / 2);
        
        this.controls.push({
            type: 'button',
            action: 'close',
            x: btnX, y: btnY, width: btnWidth, height: btnHeight
        });
    }

    drawScrollBar(scrollY, maxScroll, mouse) {
        if (maxScroll <= 0) return;

        const trackX = this.panelX + this.panelWidth - 15;
        const trackY = this.panelY + 80;
        const trackHeight = this.viewportHeight;
        
        // Scrollbar thumb
        const thumbHeight = Math.max(30, (this.viewportHeight / this.contentHeight) * trackHeight);
        const thumbY = trackY + (scrollY / maxScroll) * (trackHeight - thumbHeight);
        
        const isHovered = mouse.x >= trackX - 5 && mouse.x <= trackX + this.scrollBarWidth + 5 &&
                          mouse.y >= trackY && mouse.y <= trackY + trackHeight;
        
        // Draw rounded rect manually (for compatibility)
        const radius = 3;
        this.ctx.fillStyle = (isHovered || this.draggingScrollBar) ? COLORS.accent : 'rgba(255, 255, 255, 0.2)';
        this.ctx.beginPath();
        this.ctx.moveTo(trackX + radius, thumbY);
        this.ctx.lineTo(trackX + this.scrollBarWidth - radius, thumbY);
        this.ctx.quadraticCurveTo(trackX + this.scrollBarWidth, thumbY, trackX + this.scrollBarWidth, thumbY + radius);
        this.ctx.lineTo(trackX + this.scrollBarWidth, thumbY + thumbHeight - radius);
        this.ctx.quadraticCurveTo(trackX + this.scrollBarWidth, thumbY + thumbHeight, trackX + this.scrollBarWidth - radius, thumbY + thumbHeight);
        this.ctx.lineTo(trackX + radius, thumbY + thumbHeight);
        this.ctx.quadraticCurveTo(trackX, thumbY + thumbHeight, trackX, thumbY + thumbHeight - radius);
        this.ctx.lineTo(trackX, thumbY + radius);
        this.ctx.quadraticCurveTo(trackX, thumbY, trackX + radius, thumbY);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.controls.push({
            type: 'scrollbar',
            x: trackX - 5, y: trackY, width: 20, height: trackHeight,
            maxScroll: maxScroll, thumbHeight: thumbHeight
        });
    }

    drawVideoSettings(y, mouse) {
        y += 20; // Top padding
        
        // WebGPU Settings
        y = this.drawSectionHeader("WEBGPU", y);
        y = this.drawToggle("WebGPU Enabled", "video", "webgpuEnabled", y, mouse);
        y = this.drawSlider("Bloom Intensity", "video", "bloomIntensity", 0, 1, y, mouse);
        y = this.drawDropdown("Particle Count", "video", "particleCount", ['low', 'high', 'ultra'], y, mouse);
        y = this.drawDropdown("Lighting Quality", "video", "lightingQuality", ['off', 'simple', 'advanced'], y, mouse);
        y = this.drawToggle("Distortion Effects", "video", "distortionEffects", y, mouse);
        
        // General Video Settings
        y = this.drawSectionHeader("GENERAL", y);
        y = this.drawDropdown("Quality Preset", "video", "qualityPreset", ['low', 'medium', 'high', 'custom'], y, mouse);
        if (this.settingsManager.getSetting('video', 'qualityPreset') === 'custom') {
            y = this.drawSlider("Resolution Scale", "video", "resolutionScale", 0.5, 2.0, y, mouse);
            y = this.drawToggle("Vignette", "video", "vignette", y, mouse);
            y = this.drawToggle("Shadows", "video", "shadows", y, mouse);
            y = this.drawToggle("Lighting", "video", "lighting", y, mouse);
        }
        y = this.drawSlider("Screen Shake", "video", "screenShakeMultiplier", 0, 2, y, mouse);
        y = this.drawDropdown("Crosshair Style", "video", "crosshairStyle", ['default', 'dot', 'cross', 'circle'], y, mouse);
        y = this.drawToggle("Dynamic Crosshair", "video", "dynamicCrosshair", y, mouse);
        y = this.drawDropdown("Damage Numbers", "video", "damageNumberStyle", ['floating', 'stacking', 'off'], y, mouse);
        y = this.drawSlider("Damage Number Scale", "video", "damageNumberScale", 0.5, 2.0, y, mouse);
        y = this.drawToggle("Low Health Warning", "video", "lowHealthWarning", y, mouse);
        y = this.drawToggle("Enemy Health Bars", "video", "enemyHealthBars", y, mouse);
        y = this.drawToggle("Reload Bar", "video", "reloadBar", y, mouse);
        y = this.drawToggle("Show Debug Stats", "video", "showDebugStats", y, mouse);
        y = this.drawDropdown("FPS Limit", "video", "fpsLimit", [0, 30, 60, 120], y, mouse);
        
        return y;
    }

    drawAudioSettings(y, mouse) {
        y += 20; // Top padding
        
        y = this.drawSectionHeader("VOLUME", y);
        y = this.drawSlider("Master Volume", "audio", "masterVolume", 0, 1, y, mouse);
        y = this.drawSlider("Music Volume", "audio", "musicVolume", 0, 1, y, mouse);
        y = this.drawSlider("SFX Volume", "audio", "sfxVolume", 0, 1, y, mouse);
        
        y = this.drawSectionHeader("EFFECTS", y);
        y = this.drawToggle("Spatial Audio", "audio", "spatialAudio", y, mouse);
        
        return y;
    }

    drawGameplaySettings(y, mouse) {
        y += 20; // Top padding
        
        y = this.drawSectionHeader("CONTROLS", y);
        y = this.drawToggle("Auto Sprint", "gameplay", "autoSprint", y, mouse);
        y = this.drawToggle("Auto Reload", "gameplay", "autoReload", y, mouse);
        
        y = this.drawSectionHeader("UI", y);
        y = this.drawToggle("Show FPS", "gameplay", "showFps", y, mouse);
        y = this.drawToggle("Pause on Focus Loss", "gameplay", "pauseOnFocusLoss", y, mouse);
        
        return y;
    }

    drawControlsSettings(y, mouse) {
        y += 20; // Top padding
        y = this.drawKeybinds(y, mouse);
        return y;
    }

    drawSectionHeader(title, y) {
        this.ctx.fillStyle = COLORS.textMuted;
        this.ctx.font = 'bold 12px "Roboto Mono", monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(title, this.panelX + this.padding, y + 15);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(this.panelX + this.padding, y + 25, this.panelWidth - this.padding * 2, 1);
        
        return y + 40;
    }

    drawSlider(label, category, key, min, max, y, mouse, decimalPlaces = 2) {
        const rowHeight = 35; // Reduced from 40
        const value = this.settingsManager.getSetting(category, key) ?? min;
        const labelX = this.panelX + this.padding + 10;
        const sliderWidth = 180; // Reduced from 200
        const sliderX = this.panelX + this.panelWidth - this.padding - sliderWidth - 50; // Space for value text
        const sliderY = y + 13; // Vertical center offset
        const contentStartY = this.panelY + 80 + this.tabHeight;

        // Label
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = COLORS.textMain;
        this.ctx.font = '13px "Roboto Mono", monospace';
        this.ctx.fillText(label, labelX, y + 18);

        // Slider Track
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.fillRect(sliderX, sliderY - 2, sliderWidth, 4);

        // Slider Fill
        const normalized = (value - min) / (max - min);
        const fillWidth = sliderWidth * normalized;
        
        const fillGradient = this.ctx.createLinearGradient(sliderX, sliderY, sliderX + fillWidth, sliderY);
        fillGradient.addColorStop(0, COLORS.accentSoft);
        fillGradient.addColorStop(1, COLORS.accent);
        this.ctx.fillStyle = fillGradient;
        this.ctx.fillRect(sliderX, sliderY - 2, fillWidth, 4);

        // Handle
        const handleX = sliderX + fillWidth;
        const isHovered = mouse.x >= sliderX - 5 && mouse.x <= sliderX + sliderWidth + 5 &&
                          mouse.y >= sliderY - 10 && mouse.y <= sliderY + 10 &&
                          mouse.y >= contentStartY && mouse.y <= contentStartY + this.viewportHeight; // Clip check

        this.ctx.beginPath();
        this.ctx.arc(handleX, sliderY, isHovered ? 7 : 5, 0, Math.PI * 2);
        this.ctx.fillStyle = COLORS.textMain;
        this.ctx.fill();
        if (isHovered || (this.draggingSliderId && this.draggingSliderId.key === key)) {
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = COLORS.accent;
            this.ctx.strokeStyle = COLORS.accent;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }

        // Value Text
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = COLORS.textMuted;
        this.ctx.font = '12px "Roboto Mono", monospace';
        let displayValue = value;
        if (max <= 1) displayValue = Math.round(value * 100) + '%';
        else if (key === 'fpsLimit') displayValue = value === 0 ? 'OFF' : value.toString();
        else if (key === 'resolutionScale' || key === 'damageNumberScale') displayValue = Math.round(value * 100) + '%';
        else displayValue = Math.round(value);
        
        this.ctx.fillText(displayValue, this.panelX + this.panelWidth - this.padding - 10, y + 18);

        this.controls.push({
            type: 'slider',
            category, key, min, max,
            x: sliderX, y: sliderY - 10, width: sliderWidth, height: 20
        });

        return y + rowHeight;
    }

    drawToggle(label, category, key, y, mouse) {
        const rowHeight = 35; // Reduced from 40
        const isOn = this.settingsManager.getSetting(category, key) ?? false;
        
        const labelX = this.panelX + this.padding + 10;
        const toggleWidth = 40; // Reduced from 44
        const toggleHeight = 22; // Reduced from 24
        const toggleX = this.panelX + this.panelWidth - this.padding - toggleWidth - 10;
        const toggleY = y + 7;
        const contentStartY = this.panelY + 80 + this.tabHeight;

        // Label
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = COLORS.textMain;
        this.ctx.font = '13px "Roboto Mono", monospace';
        this.ctx.fillText(label, labelX, y + 20);

        const isHovered = mouse.x >= toggleX && mouse.x <= toggleX + toggleWidth &&
                          mouse.y >= toggleY && mouse.y <= toggleY + toggleHeight &&
                          mouse.y >= contentStartY && mouse.y <= contentStartY + this.viewportHeight;

        // Toggle Body
        this.ctx.fillStyle = isOn ? COLORS.accent : 'rgba(255, 255, 255, 0.1)';
        if (isHovered && !isOn) this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        
        const radius = 12;
        this.ctx.beginPath();
        this.ctx.moveTo(toggleX + radius, toggleY);
        this.ctx.lineTo(toggleX + toggleWidth - radius, toggleY);
        this.ctx.quadraticCurveTo(toggleX + toggleWidth, toggleY, toggleX + toggleWidth, toggleY + radius);
        this.ctx.lineTo(toggleX + toggleWidth, toggleY + toggleHeight - radius);
        this.ctx.quadraticCurveTo(toggleX + toggleWidth, toggleY + toggleHeight, toggleX + toggleWidth - radius, toggleY + toggleHeight);
        this.ctx.lineTo(toggleX + radius, toggleY + toggleHeight);
        this.ctx.quadraticCurveTo(toggleX, toggleY + toggleHeight, toggleX, toggleY + toggleHeight - radius);
        this.ctx.lineTo(toggleX, toggleY + radius);
        this.ctx.quadraticCurveTo(toggleX, toggleY, toggleX + radius, toggleY);
        this.ctx.closePath();
        this.ctx.fill();

        if (isOn) {
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = 'rgba(255, 23, 68, 0.5)';
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        // Toggle Handle
        const handleX = isOn ? toggleX + toggleWidth - 20 : toggleX + 4;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(handleX + 8, toggleY + 12, 8, 0, Math.PI * 2);
        this.ctx.fill();

        this.controls.push({
            type: 'toggle',
            category, key,
            x: toggleX, y: toggleY, width: toggleWidth, height: toggleHeight
        });

        return y + rowHeight;
    }

    drawDropdown(label, category, key, options, y, mouse) {
        const rowHeight = 35; // Reduced from 40
        const currentValue = this.settingsManager.getSetting(category, key);
        
        const labelX = this.panelX + this.padding + 10;
        const dropdownWidth = 140; // Reduced from 150
        const dropdownHeight = 28; // Reduced from 30
        const dropdownX = this.panelX + this.panelWidth - this.padding - dropdownWidth - 10;
        const dropdownY = y + 4;
        const contentStartY = this.panelY + 80 + this.tabHeight;

        // Label
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = COLORS.textMain;
        this.ctx.font = '13px "Roboto Mono", monospace';
        this.ctx.fillText(label, labelX, y + 20);

        const isHovered = mouse.x >= dropdownX && mouse.x <= dropdownX + dropdownWidth &&
                          mouse.y >= dropdownY && mouse.y <= dropdownY + dropdownHeight &&
                          mouse.y >= contentStartY && mouse.y <= contentStartY + this.viewportHeight;

        // Dropdown Box
        this.ctx.fillStyle = isHovered ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(dropdownX, dropdownY, dropdownWidth, dropdownHeight);
        this.ctx.strokeStyle = COLORS.glassBorder;
        this.ctx.strokeRect(dropdownX, dropdownY, dropdownWidth, dropdownHeight);

        // Text
        this.ctx.fillStyle = COLORS.textMain;
        this.ctx.textAlign = 'left';
        this.ctx.font = '12px "Roboto Mono", monospace';
        let displayValue = currentValue;
        if (key === 'fpsLimit') displayValue = currentValue === 0 ? 'OFF' : currentValue.toString();
        else if (key === 'particleCount') {
            // Map internal values to display names
            if (currentValue === 'low') displayValue = 'LOW';
            else if (currentValue === 'high') displayValue = 'HIGH';
            else if (currentValue === 'ultra') displayValue = 'ULTRA';
            else displayValue = String(currentValue).toUpperCase();
        } else if (key === 'lightingQuality') {
            displayValue = String(currentValue).toUpperCase();
        } else {
            displayValue = String(currentValue).toUpperCase();
        }
        this.ctx.fillText(displayValue, dropdownX + 10, dropdownY + 18);

        // Arrow
        this.ctx.fillStyle = COLORS.textMuted;
        this.ctx.beginPath();
        this.ctx.moveTo(dropdownX + dropdownWidth - 18, dropdownY + 11);
        this.ctx.lineTo(dropdownX + dropdownWidth - 13, dropdownY + 11);
        this.ctx.lineTo(dropdownX + dropdownWidth - 15.5, dropdownY + 16);
        this.ctx.fill();

        this.controls.push({
            type: 'dropdown',
            category, key, options,
            x: dropdownX, y: dropdownY, width: dropdownWidth, height: dropdownHeight
        });

        return y + rowHeight;
    }

    drawDropdownMenu(dropdown, mouse) {
        const { x, y, width, options } = dropdown;
        const itemHeight = 30;
        const menuHeight = options.length * itemHeight;
        
        // Background
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(x, y + 30, width, menuHeight);
        this.ctx.strokeStyle = COLORS.accent;
        this.ctx.strokeRect(x, y + 30, width, menuHeight);

        options.forEach((opt, index) => {
            const itemY = y + 30 + index * itemHeight;
            const isItemHovered = mouse.x >= x && mouse.x <= x + width &&
                                  mouse.y >= itemY && mouse.y <= itemY + itemHeight;

            if (isItemHovered) {
                this.ctx.fillStyle = COLORS.accent;
                this.ctx.fillRect(x, itemY, width, itemHeight);
            }

            this.ctx.fillStyle = isItemHovered ? '#fff' : COLORS.textMuted;
            this.ctx.textAlign = 'left';
            let displayOpt = opt;
            if (typeof opt === 'number' && opt === 0) displayOpt = 'OFF';
            else if (typeof opt === 'number') displayOpt = opt.toString();
            this.ctx.fillText(String(displayOpt).toUpperCase(), x + 10, itemY + 20);
        });
    }

    drawKeybinds(y, mouse) {
        const controls = this.controlMode === 'keyboard' ? 
            this.settingsManager.settings.controls : 
            (this.settingsManager.settings.gamepad || {});

        // Toggle Button (Keyboard / Controller)
        const toggleWidth = 280; // Reduced from 300
        const toggleHeight = 34; // Reduced from 36
        const toggleX = this.panelX + (this.panelWidth - toggleWidth) / 2;
        const toggleY = y + 5;
        
        // Background
        this.ctx.fillStyle = COLORS.glassBg;
        this.ctx.fillRect(toggleX, toggleY, toggleWidth, toggleHeight);
        this.ctx.strokeStyle = COLORS.glassBorder;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(toggleX, toggleY, toggleWidth, toggleHeight);
        
        // Active Selection
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
        this.ctx.font = 'bold 13px "Roboto Mono", monospace';
        this.ctx.textBaseline = 'middle';
        this.ctx.textAlign = 'center';
        
        this.ctx.fillStyle = this.controlMode === 'keyboard' ? COLORS.textMain : COLORS.textMuted;
        this.ctx.fillText('KEYBOARD', toggleX + toggleWidth / 4, toggleY + toggleHeight / 2);
        
        this.ctx.fillStyle = this.controlMode === 'gamepad' ? COLORS.textMain : COLORS.textMuted;
        this.ctx.fillText('CONTROLLER', toggleX + 3 * toggleWidth / 4, toggleY + toggleHeight / 2);

        this.controls.push({
            type: 'controlModeToggle',
            x: toggleX, y: toggleY, width: toggleWidth, height: toggleHeight
        });

        y += 50; // Reduced from 60

        let labels;
        if (this.controlMode === 'keyboard') {
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
                weapon3: 'Rifle',
                weapon4: 'Flamethrower'
            };
            // Toggle Switch for Scroll Wheel (only show for keyboard mode)
            y = this.drawToggle("Scroll Switch", "controls", "scrollWheelSwitch", y, mouse);
        } else {
            labels = {
                fire: 'Fire',
                reload: 'Reload',
                grenade: 'Grenade',
                sprint: 'Sprint',
                melee: 'Melee',
                prevWeapon: 'Prev Weapon',
                nextWeapon: 'Next Weapon',
                pause: 'Pause'
            };
        }

        // Keybind List
        const keys = Object.keys(labels);
        keys.forEach(key => {
            const label = labels[key];
            let boundKey = '---';
            
            if (this.controlMode === 'keyboard') {
                boundKey = (controls[key] || '').toUpperCase();
            } else {
                boundKey = this.getGamepadButtonName(controls[key]);
            }

            const rowHeight = 35; // Reduced from 40
            const contentStartY = this.panelY + 80 + this.tabHeight;
            
            const labelX = this.panelX + this.padding + 10;
            const btnWidth = 90; // Reduced from 100
            const btnHeight = 28; // Reduced from 30
            const btnX = this.panelX + this.panelWidth - this.padding - btnWidth - 10;
            const btnY = y + 4;

            // Label
            this.ctx.textAlign = 'left';
            this.ctx.fillStyle = COLORS.textMain;
            this.ctx.font = '13px "Roboto Mono", monospace';
            this.ctx.fillText(label, labelX, y + 20);

            const isRebinding = this.rebindingAction === key;
            const isHovered = mouse.x >= btnX && mouse.x <= btnX + btnWidth &&
                              mouse.y >= btnY && mouse.y <= btnY + btnHeight &&
                              mouse.y >= contentStartY && mouse.y <= contentStartY + this.viewportHeight;

            // Button
            if (isRebinding) {
                this.ctx.fillStyle = COLORS.accent;
                this.ctx.strokeStyle = '#fff';
            } else {
                this.ctx.fillStyle = isHovered ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)';
                this.ctx.strokeStyle = COLORS.glassBorder;
            }
            
            this.ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
            this.ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);

            // Key Text
            this.ctx.fillStyle = isRebinding ? '#fff' : COLORS.textMain;
            this.ctx.textAlign = 'center';
            this.ctx.font = '12px "Roboto Mono", monospace';
            this.ctx.fillText(isRebinding ? '...' : boundKey.toUpperCase(), btnX + btnWidth / 2, btnY + 18);

            this.controls.push({
                type: 'keybind',
                action: key,
                x: btnX, y: btnY, width: btnWidth, height: btnHeight
            });

            y += rowHeight;
        });

        return y;
    }

    handleWheel(e) {
        if (!this.visible) return;
        
        // Add delta to target scroll
        this.targetScrollY += e.deltaY;
        
        // Clamp target immediately to prevent infinite scroll accumulation
        const maxScroll = Math.max(0, this.contentHeight - this.viewportHeight);
        if (this.targetScrollY < 0) this.targetScrollY = 0;
        if (this.targetScrollY > maxScroll) this.targetScrollY = maxScroll;
    }

    handleClick(x, y) {
        if (!this.visible) return false;

        // Handle active dropdown selection
        if (this.activeDropdown) {
            const { x: dropX, y: dropY, width, options, category, key } = this.activeDropdown;
            const itemHeight = 30;
            const menuHeight = options.length * itemHeight;
            
            // Check if clicked inside menu
            if (x >= dropX && x <= dropX + width && y >= dropY + 30 && y <= dropY + 30 + menuHeight) {
                const index = Math.floor((y - (dropY + 30)) / itemHeight);
                if (index >= 0 && index < options.length) {
                    const selected = options[index];
                    if (category === 'video' && key === 'qualityPreset') {
                        this.settingsManager.applyVideoPreset(selected);
                    } else {
                        this.settingsManager.setSetting(category, key, selected);
                    }
                    
                    // Apply FPS limit immediately if changed
                    if (category === 'video' && key === 'fpsLimit') {
                        if (window.gameEngine) {
                            window.gameEngine.setFPSLimit(selected);
                        }
                    }
                }
                this.activeDropdown = null;
                return true;
            }
            
            // Clicked outside, close dropdown
            this.activeDropdown = null;
            return true;
        }

        // Handle Rebinding Cancel
        if (this.rebindingAction) {
            // Clicking anywhere cancels rebind (except handled keys)
            this.cancelRebind();
            return true;
        }

        // Check controls
        for (const ctrl of this.controls) {
            // Skip controls if they are clipped (not visible in viewport)
            // Exception: Scrollbar, Footer, Tab, and ControlModeToggle are always clickable
            if (ctrl.type !== 'button' && ctrl.type !== 'scrollbar' && ctrl.type !== 'controlModeToggle' && ctrl.type !== 'tab') {
                const contentStartY = this.panelY + 80 + this.tabHeight;
                if (ctrl.y < contentStartY || ctrl.y + ctrl.height > contentStartY + this.viewportHeight) {
                    continue;
                }
            }

            if (x >= ctrl.x && x <= ctrl.x + ctrl.width && y >= ctrl.y && y <= ctrl.y + ctrl.height) {
                if (ctrl.type === 'tab') {
                    this.activeTab = ctrl.tab;
                    this.scrollY = 0;
                    this.targetScrollY = 0;
                    return true;
                }
                else if (ctrl.type === 'button' && ctrl.action === 'close') {
                    this.close();
                    return true;
                }
                else if (ctrl.type === 'slider') {
                    this.draggingSlider = true;
                    this.draggingSliderId = { category: ctrl.category, key: ctrl.key, min: ctrl.min, max: ctrl.max, width: ctrl.width, x: ctrl.x };
                    this.updateSlider(x);
                    return true;
                }
                else if (ctrl.type === 'toggle') {
                    const current = this.settingsManager.getSetting(ctrl.category, ctrl.key);
                    this.settingsManager.setSetting(ctrl.category, ctrl.key, !current);
                    return true;
                }
                else if (ctrl.type === 'dropdown') {
                    this.activeDropdown = ctrl;
                    return true;
                }
                else if (ctrl.type === 'controlModeToggle') {
                    const relativeX = x - ctrl.x;
                    if (relativeX < ctrl.width / 2) {
                        this.controlMode = 'keyboard';
                    } else {
                        this.controlMode = 'gamepad';
                    }
                    return true;
                }
                else if (ctrl.type === 'keybind') {
                    this.startRebind(ctrl.action);
                    return true;
                }
                else if (ctrl.type === 'scrollbar') {
                    this.draggingScrollBar = true;
                    // Move scroll immediately
                    this.updateScrollBar(y, ctrl);
                    return true;
                }
            }
        }

        return false;
    }

    handleMouseMove(x, y) {
        if (!this.visible) return;

        if (this.draggingSlider && this.draggingSliderId) {
            this.updateSlider(x);
        }

        if (this.draggingScrollBar) {
            const trackY = this.panelY + 80;
            const trackHeight = this.viewportHeight;
            const relativeY = Math.max(0, Math.min(trackHeight, y - trackY));
            const percent = relativeY / trackHeight;
            const maxScroll = Math.max(0, this.contentHeight - this.viewportHeight);
            
            this.targetScrollY = percent * maxScroll;
            this.scrollY = this.targetScrollY; // Snappy scroll when dragging bar
        }
    }

    handleMouseUp() {
        this.draggingSlider = false;
        this.draggingSliderId = null;
        this.draggingScrollBar = false;
    }

    updateSlider(x) {
        const ctrl = this.draggingSliderId;
        if (!ctrl) return;

        const relativeX = Math.max(0, Math.min(ctrl.width, x - ctrl.x));
        const percent = relativeX / ctrl.width;
        let value = ctrl.min + percent * (ctrl.max - ctrl.min);
        
        // Special cases handling
        if (ctrl.category === 'video' && ctrl.key === 'screenShakeMultiplier') {
            // Keep as float 0-1
        } else if (ctrl.category === 'video' && (ctrl.key === 'particleCount' || ctrl.key === 'fpsLimit')) {
             value = Math.round(value);
        } else if (ctrl.category === 'video' && ctrl.key === 'resolutionScale') {
            // Keep as float, but clamp to 0.5-2.0 range
            value = Math.max(0.5, Math.min(2.0, value));
        } else if (ctrl.category === 'audio') {
            // Keep as float 0-1
        }

        this.settingsManager.setSetting(ctrl.category, ctrl.key, value);
        
        // Live updates
        if (ctrl.category === 'audio') {
            updateAudioSettings();
        }
        
        // Apply resolution scale immediately if changed
        if (ctrl.category === 'video' && ctrl.key === 'resolutionScale') {
            // Trigger canvas resize to apply new resolution scale
            if (gameState.players.length > 0) {
                resizeCanvas(gameState.players[0]);
            }
        }
    }

    updateScrollBar(y, ctrl) {
         // Logic handled in mousemove for smoother dragging, but click-to-jump handled here
         const trackY = this.panelY + 80;
         const trackHeight = this.viewportHeight;
         const relativeY = Math.max(0, Math.min(trackHeight, y - trackY));
         const percent = relativeY / trackHeight;
         
         this.targetScrollY = percent * ctrl.maxScroll;
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

