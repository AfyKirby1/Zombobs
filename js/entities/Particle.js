import { ctx } from '../core/canvas.js';
import { graphicsSettings } from '../systems/GraphicsSystem.js';

export class Particle {
    constructor(x, y, color) {
        this.reset(x, y, color);
    }

    reset(x, y, color, props = {}) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = props.radius !== undefined ? props.radius : Math.random() * 3 + 1;
        this.vx = props.vx !== undefined ? props.vx : (Math.random() - 0.5) * 4;
        this.vy = props.vy !== undefined ? props.vy : (Math.random() - 0.5) * 4;
        this.life = props.life !== undefined ? props.life : 30;
        this.maxLife = props.maxLife !== undefined ? props.maxLife : (props.life || 30);
        
        // Optional update/draw overrides if passed (for custom particles like explosion flash)
        // But ideally we avoid function properties on pooled objects for GC reasons, 
        // though replacing them is fine.
        this.customUpdate = null;
        this.customDraw = null;
    }

    update() {
        if (this.customUpdate) {
            this.customUpdate();
            return;
        }
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }

    draw(ctx) { // ctx passed in main.js loop? No, main.js uses global ctx usually or imports it. 
               // Particle.js method signature in main.js: particle.draw() (no args usually, uses imported ctx)
               // But DamageNumber.draw(ctx) takes ctx.
               // Let's check main.js: 
               // gameState.particles.forEach(particle => { if (particle.draw) particle.draw() ... })
        
        if (this.customDraw) {
            this.customDraw();
            return;
        }
        
        // We need to import ctx if we want to draw here, 
        // but this file already imports ctx at the top.
        
        const alpha = Math.max(0, this.life / this.maxLife);
        // We can't easily change globalAlpha here without affecting others if not saved/restored 
        // or if we rely on main.js setting it.
        // main.js implementation:
        /*
            gameState.particles.forEach(particle => {
                if (particle.draw) {
                    particle.draw();
                } else {
                    const maxLife = particle.maxLife || 30;
                    ctx.fillStyle = particle.color;
                    ctx.globalAlpha = Math.max(0, particle.life / maxLife);
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
            });
        */
       // So standard particles don't even use this draw method in main.js!
       // But I should enable it to encapsulate logic.
       
        // Re-importing ctx here to be safe, though it is already imported in the file.
        // The class currently has a draw() method but main.js ignores it if it's a simple object? 
        // No, main.js checks `if (particle.draw)`.
        
        // Let's make sure we use the imported ctx
        // import { ctx } from '../core/canvas.js'; // Already at top of file
    }
}

export class DamageNumber {
    constructor(x, y, value, isCrit = false, customColor = null, customFontSize = null) {
        this.x = x + (Math.random() - 0.5) * 10; // Start at zombie's x with some jitter
        this.y = y;
        this.value = value;
        this.isCrit = isCrit;
        this.customColor = customColor; // Optional custom color (e.g., '#00ffff' for cyan)
        this.customFontSize = customFontSize; // Optional custom font size (V0.7.1)
        this.life = 60; // 1 second at 60fps
        this.maxLife = 60;
        this.vy = isCrit ? -2.0 : -1.5; // Faster upward velocity for crits
        this.vx = (Math.random() - 0.5) * 0.5; // Slight horizontal drift
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.03; // A bit of gravity to slow the ascent
        this.life--;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        const alpha = Math.max(0, this.life / this.maxLife);
        const damageQuality = graphicsSettings.getQualityValues('damageNumber');
        // Use custom font size if provided, otherwise calculate based on crit status
        const baseFontSize = this.customFontSize !== null 
            ? this.customFontSize 
            : (this.isCrit ? (this.value === "CRIT!" ? 20 : 22) : 16);
        const fontSize = baseFontSize * damageQuality.fontSize;
        
        if (this.isCrit) {
            // Critical hit styling: larger, yellow/red gradient, more prominent
            ctx.font = `bold ${fontSize}px "Roboto Mono", monospace`;
            ctx.textAlign = 'center';
            
            // Yellow to red gradient for crits
            const gradient = ctx.createLinearGradient(this.x - 30, this.y, this.x + 30, this.y);
            gradient.addColorStop(0, `rgba(255, 255, 0, ${alpha})`);
            gradient.addColorStop(0.5, `rgba(255, 200, 0, ${alpha})`);
            gradient.addColorStop(1, `rgba(255, 100, 0, ${alpha})`);
            ctx.fillStyle = gradient;
            
            // Quality-based glow and outline
            if (damageQuality.hasGlow) {
                ctx.shadowColor = `rgba(255, 0, 0, ${0.8 * damageQuality.glowIntensity})`;
                ctx.shadowBlur = 8 * damageQuality.glowIntensity;
            } else {
                ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
                ctx.shadowBlur = 8;
            }
            
            // Outline for high/ultra quality
            if (damageQuality.hasOutline) {
                ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.8})`;
                ctx.lineWidth = damageQuality.outlineWidth;
                ctx.strokeText(this.value, this.x, this.y);
            }
            
            ctx.fillText(this.value, this.x, this.y);
        } else {
            // Use custom color if provided, otherwise default to yellow
            if (this.customColor) {
                // Parse hex color and apply alpha
                const r = parseInt(this.customColor.slice(1, 3), 16);
                const g = parseInt(this.customColor.slice(3, 5), 16);
                const b = parseInt(this.customColor.slice(5, 7), 16);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            } else {
                ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`; // Yellow color for normal damage
            }
            ctx.font = `bold ${fontSize}px "Roboto Mono", monospace`;
            ctx.textAlign = 'center';
            
            // Quality-based shadow/glow
            if (damageQuality.hasGlow) {
                ctx.shadowColor = `rgba(0, 0, 0, ${0.7 * damageQuality.glowIntensity})`;
                ctx.shadowBlur = 4 * damageQuality.glowIntensity;
            } else {
                ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                ctx.shadowBlur = 4;
            }
            
            // Outline for high/ultra quality
            if (damageQuality.hasOutline) {
                ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.8})`;
                ctx.lineWidth = damageQuality.outlineWidth;
                ctx.strokeText(this.value, this.x, this.y);
            }
            
            ctx.fillText(this.value, this.x, this.y);
        }
        
        ctx.restore();
    }
}

