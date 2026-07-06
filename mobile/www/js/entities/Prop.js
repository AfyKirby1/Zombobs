import { ctx } from '../core/canvas.js';

/**
 * Prop - Base class for world props (rocks, debris, burnt cars, skulls, zombie parts)
 * Props are static decorative elements that spawn procedurally
 */
export class Prop {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'rock', 'debris', 'burntCar', 'skull', 'zombieArms', 'zombieLegs', 'trashCan', 'explosiveBarrel', 'abandonedMotorbike', 'sandbagBarricade', 'medicalCrate', 'concreteBarrier', 'ammoCrate'
        this.rotation = Math.random() * Math.PI * 2; // Random rotation
        
        // Set dimensions and visual properties based on type
        switch (type) {
            case 'rock':
                this.width = 20 + Math.random() * 15; // 20-35px
                this.height = 20 + Math.random() * 15;
                this.color = '#5a5a5a'; // Slightly lighter gray base
                this.outlineColor = '#2a2a2a';
                
                // Generate jagged vertices for irregular rock shape
                this.vertices = [];
                const numPoints = 7 + Math.floor(Math.random() * 5); // 7-11 points
                for (let i = 0; i < numPoints; i++) {
                    const angle = (i / numPoints) * Math.PI * 2;
                    // Vary radius significantly for jagged look (0.6 to 1.0)
                    const r = 0.6 + Math.random() * 0.4;
                    this.vertices.push({
                        x: Math.cos(angle) * (this.width/2) * r,
                        y: Math.sin(angle) * (this.height/2) * r
                    });
                }
                
                // Generate cracks/texture details
                this.cracks = [];
                const numCracks = 2 + Math.floor(Math.random() * 3);
                for(let i=0; i<numCracks; i++) {
                     this.cracks.push({
                         x: (Math.random() - 0.5) * this.width * 0.5,
                         y: (Math.random() - 0.5) * this.height * 0.5,
                         length: 4 + Math.random() * 8,
                         angle: Math.random() * Math.PI * 2,
                         width: 0.5 + Math.random() * 1,
                         midOffsetX: (Math.random() - 0.5) * 2,
                         midOffsetY: (Math.random() - 0.5) * 2
                     });
                }
                break;
            case 'debris':
                this.width = 25 + Math.random() * 20; // Increased size slightly
                this.height = 25 + Math.random() * 20;
                this.color = '#3a3a3a';
                this.outlineColor = '#1a1a1a';
                
                // Generate scattered debris pieces instead of one block
                this.debrisPieces = [];
                const numPieces = 4 + Math.floor(Math.random() * 4); // 4-7 pieces
                for(let i=0; i<numPieces; i++) {
                    const size = 6 + Math.random() * 10;
                    this.debrisPieces.push({
                        x: (Math.random() - 0.5) * this.width * 0.8,
                        y: (Math.random() - 0.5) * this.height * 0.8,
                        w: size,
                        h: size * (0.5 + Math.random() * 1), // Irregular aspect ratio
                        rot: Math.random() * Math.PI * 2,
                        color: Math.random() > 0.5 ? '#4a4a4a' : '#2a2a2a' // Varied gray
                    });
                }
                break;
            case 'burntCar':
                this.width = 60 + Math.random() * 30; // 60-90px (increased from 40-60px)
                this.height = 80 + Math.random() * 40; // 80-120px (increased from 60-80px)
                this.color = '#1a1a1a';
                this.outlineColor = '#0a0a0a';
                
                // Initialize static visual details (rust, cracks) so they don't jitter
                this.initBurntCarDetails();
                
                // Initialize smoke particles for burnt car
                this.smokeParticles = [];
                this.initSmokeParticles();
                // Initialize fire particles for burnt car
                this.fireParticles = [];
                this.initFireParticles();
                break;
            case 'skull':
                this.width = 25 + Math.random() * 10; // 25-35px
                this.height = 25 + Math.random() * 10;
                this.color = '#e8e8e8'; // Bone white
                this.outlineColor = '#4a4a4a'; // Dark cracks
                // Store fixed texture mark positions for bone texture
                this.textureMarks = [];
                for (let i = 0; i < 4; i++) {
                    this.textureMarks.push({
                        x: (Math.random() - 0.5) * 0.6,
                        y: (Math.random() - 0.5) * 0.6,
                        size: 1 + Math.random() * 1.5
                    });
                }
                break;
            case 'zombieArms':
                this.width = 25 + Math.random() * 10; // 25-35px width (shoulder to hand width area)
                this.height = 45 + Math.random() * 15; // 45-60px total length roughly
                this.color = '#7a8a65'; // Greenish decayed flesh (more zombie-like than brown)
                this.outlineColor = '#3a4a25'; // Darker green/black outline
                this.armCount = 2 + Math.floor(Math.random() * 2); // 2-3 arms
                // Store random properties for each arm
                this.armProps = [];
                for (let i = 0; i < this.armCount; i++) {
                    this.armProps.push({
                        rotation: (Math.random() - 0.5) * 1.5, // More random rotation variation
                        elbowAngle: 0.2 + Math.random() * 0.8, // Slight bend to 90 degree bend
                        scale: 0.8 + Math.random() * 0.4,
                        flip: Math.random() > 0.5 ? 1 : -1, // Left or right bending
                        goreVerts: Array.from({ length: 5 }, (_, k) => ({
                            angle: (k / 5) * Math.PI * 2,
                            rOffset: Math.random() * 2
                        }))
                    });
                }
                break;
            case 'zombieLegs':
                this.width = 30 + Math.random() * 10; // 30-40px width (hip width area)
                this.height = 60 + Math.random() * 20; // 60-80px total length
                this.color = '#7a8a65'; // Greenish decayed flesh
                this.outlineColor = '#3a4a25';
                // Store random properties for each leg
                this.legProps = [];
                for (let i = 0; i < 2; i++) {
                    this.legProps.push({
                        rotation: (Math.random() - 0.5) * 0.5,
                        kneeAngle: 0.1 + Math.random() * 0.4, // Less bend than elbow typically for lying legs
                        scale: 0.9 + Math.random() * 0.3,
                        flip: Math.random() > 0.5 ? 1 : -1,
                        goreVerts: Array.from({ length: 6 }, (_, k) => ({
                            angle: (k / 6) * Math.PI * 2,
                            rOffset: Math.random() * 2.5
                        }))
                    });
                }
                break;
            case 'trashCan':
                this.width = 30 + Math.random() * 10; // 30-40px
                this.height = 35 + Math.random() * 10; // 35-45px (slightly taller for cylindrical look)
                this.color = '#2d5016'; // Dark green metal base
                this.outlineColor = '#1a300a'; // Darker green outline
                
                // Initialize static visual details (lid position, dents) to prevent jittering
                this.initTrashCanDetails();
                
                // Initialize fire particles for trash can
                this.fireParticles = [];
                this.initTrashCanFireParticles();
                break;
            case 'explosiveBarrel':
                this.width = 30;
                this.height = 42;
                this.maxHealth = 15;
                this.health = 15;
                this.ignited = false;
                this.ignitedTime = 0;
                this.fuseTime = 600;
                this.detonated = false;
                this.isExplosive = true;
                break;
            case 'abandonedMotorbike':
                this.width = 70 + Math.random() * 20;
                this.height = 35 + Math.random() * 12;
                this.color = '#3a3a3a';
                this.outlineColor = '#1a1a1a';
                this.fallenSide = Math.random() > 0.5 ? 1 : -1;
                this.initMotorbikeDetails();
                break;
            case 'sandbagBarricade':
                this.width = 80 + Math.random() * 25;
                this.height = 45 + Math.random() * 15;
                this.color = '#8b7355';
                this.outlineColor = '#4a3a2a';
                this.initSandbagDetails();
                break;
            case 'medicalCrate':
                this.width = 50 + Math.random() * 15;
                this.height = 40 + Math.random() * 12;
                this.color = '#c8c8c0';
                this.outlineColor = '#5a5a50';
                this.initMedicalCrateDetails();
                break;
            case 'concreteBarrier':
                this.width = 65 + Math.random() * 20;
                this.height = 35 + Math.random() * 10;
                this.color = '#9a9a96';
                this.outlineColor = '#5a5a56';
                this.initConcreteBarrierDetails();
                break;
            case 'ammoCrate':
                this.width = 55 + Math.random() * 15;
                this.height = 45 + Math.random() * 12;
                this.color = '#3d4a2a';
                this.outlineColor = '#1a2010';
                this.initAmmoCrateDetails();
                break;
            default:
                this.width = 20;
                this.height = 20;
                this.color = '#4a4a4a';
                this.outlineColor = '#2a2a2a';
        }
        
        // Collision bounds (circular for simplicity)
        this.radius = Math.max(this.width, this.height) / 2;
    }

    /**
     * Initialize static details for burnt car to prevent jittering
     */
    initBurntCarDetails() {
        // Rust patches
        this.rustPatches = [];
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        for(let i=0; i<3; i++) {
            this.rustPatches.push({
                x: (Math.random() - 0.5) * halfWidth * 1.5,
                y: (Math.random() - 0.5) * halfHeight * 1.5,
                radius: Math.random() * 10 + 5
            });
        }

        // Window crack details
        this.frontWindowCracks = this.generateCrackData(this.width * 0.9 * 0.85, this.height * 0.6 * 0.25); // Approximate dims
        this.rearWindowCracks = this.generateCrackData(this.width * 0.9 * 0.85, this.height * 0.6 * 0.2);
    }

    /**
     * Helper to generate random crack data for windows
     */
    generateCrackData(w, h) {
        const centerX = (Math.random() - 0.5) * w * 0.5;
        const centerY = (Math.random() - 0.5) * h * 0.5;
        const lines = [];
        for(let i=0; i<5; i++) {
            lines.push((i/5) * Math.PI * 2 + Math.random());
        }
        return { centerX, centerY, lines };
    }

    /**
     * Initialize smoke particles for burnt car
     */
    initSmokeParticles() {
        const particleCount = 3 + Math.floor(Math.random() * 3); // 3-5 particles
        this.smokeParticles = [];
        this.lastUpdateTime = Date.now(); // Initialize update time
        
        for (let i = 0; i < particleCount; i++) {
            this.smokeParticles.push({
                x: (Math.random() - 0.5) * this.width * 0.6, // Random position on hood
                y: -this.height * 0.4 + Math.random() * this.height * 0.2, // Top of car
                vx: (Math.random() - 0.5) * 0.4, // Horizontal drift
                vy: -0.5 - Math.random() * 0.5, // Rise speed
                opacity: 0.3 + Math.random() * 0.3, // 0.3-0.6
                size: 3 + Math.random() * 4, // 3-7px
                lifetime: 2000 + Math.random() * 2000, // 2-4 seconds
                age: Math.random() * 1000, // Random starting age
                currentOpacity: 0.3 + Math.random() * 0.3 // Initialize current opacity
            });
        }
    }

    /**
     * Initialize fire particles for burnt car
     * Fire particles spawn from windows and engine area
     */
    initFireParticles() {
        const fireColors = ['#ff6600', '#ff8800', '#ffaa00', '#ffff00', '#ff4400', '#ff0000'];
        const particleCount = 4 + Math.floor(Math.random() * 4); // 4-7 particles
        
        for (let i = 0; i < particleCount; i++) {
            // Determine spawn location: windows or engine/hood
            const locationType = Math.random();
            let spawnX, spawnY;
            
            if (locationType < 0.4) {
                // Left window
                spawnX = -this.width * 0.4 + Math.random() * this.width * 0.2;
                spawnY = -this.height * 0.15 + Math.random() * this.height * 0.15;
            } else if (locationType < 0.8) {
                // Right window
                spawnX = this.width * 0.2 + Math.random() * this.width * 0.2;
                spawnY = -this.height * 0.15 + Math.random() * this.height * 0.15;
            } else {
                // Engine/hood area
                spawnX = (Math.random() - 0.5) * this.width * 0.5;
                spawnY = -this.height * 0.45 + Math.random() * this.height * 0.1;
            }
            
            this.fireParticles.push({
                x: spawnX,
                y: spawnY,
                vx: (Math.random() - 0.5) * 0.3, // Horizontal drift
                vy: -0.8 - Math.random() * 0.6, // Rise speed (faster than smoke)
                color: fireColors[Math.floor(Math.random() * fireColors.length)],
                baseOpacity: 0.7 + Math.random() * 0.3, // 0.7-1.0
                size: 4 + Math.random() * 5, // 4-9px
                baseSize: 4 + Math.random() * 5, // Store base size for flickering
                lifetime: 1000 + Math.random() * 1000, // 1-2 seconds (shorter than smoke)
                age: Math.random() * 500, // Random starting age
                flickerPhase: Math.random() * Math.PI * 2, // Random phase for flickering
                currentOpacity: 0.7 + Math.random() * 0.3,
                currentSize: 4 + Math.random() * 5
            });
        }
    }

    /**
     * Initialize static details for trash can to prevent jittering
     */
    initTrashCanDetails() {
        // Dents/scratches
        this.dents = [];
        const numDents = 2 + Math.floor(Math.random() * 2); // 2-3 dents
        for (let i = 0; i < numDents; i++) {
            this.dents.push({
                x: (Math.random() - 0.5) * this.width * 0.6,
                y: (Math.random() - 0.5) * this.height * 0.6,
                radius: 2 + Math.random() * 3
            });
        }
        
        // Lid opening angle (slightly open for fire)
        this.lidOpenAngle = 0.3 + Math.random() * 0.2; // 0.3-0.5 radians
    }

    /**
     * Initialize fire particles for trash can
     * Fire particles spawn from top center of trash can
     */
    initTrashCanFireParticles() {
        const fireColors = ['#ff6600', '#ff8800', '#ffaa00', '#ffff00', '#ff4400', '#ff0000'];
        const particleCount = 3 + Math.floor(Math.random() * 3); // 3-5 particles
        
        for (let i = 0; i < particleCount; i++) {
            // Spawn from top center of trash can
            const spawnX = (Math.random() - 0.5) * this.width * 0.3; // Small spread around center
            const spawnY = -this.height * 0.4; // Top of trash can
            
            this.fireParticles.push({
                x: spawnX,
                y: spawnY,
                vx: (Math.random() - 0.5) * 0.4, // Horizontal drift
                vy: -0.8 - Math.random() * 0.4, // Rise speed (-0.8 to -1.2)
                color: fireColors[Math.floor(Math.random() * fireColors.length)],
                baseOpacity: 0.7 + Math.random() * 0.3, // 0.7-1.0
                size: 4 + Math.random() * 4, // 4-8px
                baseSize: 4 + Math.random() * 4, // Store base size for flickering
                lifetime: 1000 + Math.random() * 1000, // 1-2 seconds
                age: Math.random() * 500, // Random starting age
                flickerPhase: Math.random() * Math.PI * 2, // Random phase for flickering
                currentOpacity: 0.7 + Math.random() * 0.3,
                currentSize: 4 + Math.random() * 4
            });
        }
    }

    /**
     * Update smoke and fire particles (for burntCar and trashCan)
     */
    update() {
        if (this.type === 'burntCar' && this.smokeParticles) {
            this.updateBurntCarParticles();
        } else if (this.type === 'trashCan' && this.fireParticles) {
            this.updateTrashCanFireParticles();
        } else if (this.type === 'explosiveBarrel' && this.ignited && !this.detonated) {
            this.updateExplosiveBarrel();
        } else {
            return;
        }
    }

    /**
     * Update burnt car smoke and fire particles
     */
    updateBurntCarParticles() {
        
        const now = Date.now();
        if (!this.lastUpdateTime) {
            this.lastUpdateTime = now;
            return;
        }
        
        const deltaTime = Math.min(now - this.lastUpdateTime, 100); // Cap deltaTime to prevent large jumps
        this.lastUpdateTime = now;
        
        // Update smoke particles
        for (let i = 0; i < this.smokeParticles.length; i++) {
            const particle = this.smokeParticles[i];
            
            // Update age
            particle.age += deltaTime;
            
            // Respawn if expired
            if (particle.age >= particle.lifetime) {
                particle.x = (Math.random() - 0.5) * this.width * 0.6;
                particle.y = -this.height * 0.4 + Math.random() * this.height * 0.2;
                particle.age = 0;
                particle.opacity = 0.3 + Math.random() * 0.3;
                particle.currentOpacity = particle.opacity;
            } else {
                // Update position (relative to car)
                particle.x += particle.vx * (deltaTime / 16); // Normalize to 60fps
                particle.y += particle.vy * (deltaTime / 16);
                
                // Fade out over lifetime
                const lifeRatio = particle.age / particle.lifetime;
                particle.currentOpacity = particle.opacity * (1 - lifeRatio);
            }
        }
        
        // Update fire particles
        if (this.fireParticles && this.fireParticles.length > 0) {
            for (let i = 0; i < this.fireParticles.length; i++) {
                const particle = this.fireParticles[i];
                
                // Update age
                particle.age += deltaTime;
                
                // Respawn if expired
                if (particle.age >= particle.lifetime) {
                    // Respawn at original location type
                    const locationType = Math.random();
                    if (locationType < 0.4) {
                        // Left window
                        particle.x = -this.width * 0.4 + Math.random() * this.width * 0.2;
                        particle.y = -this.height * 0.15 + Math.random() * this.height * 0.15;
                    } else if (locationType < 0.8) {
                        // Right window
                        particle.x = this.width * 0.2 + Math.random() * this.width * 0.2;
                        particle.y = -this.height * 0.15 + Math.random() * this.height * 0.15;
                    } else {
                        // Engine/hood area
                        particle.x = (Math.random() - 0.5) * this.width * 0.5;
                        particle.y = -this.height * 0.45 + Math.random() * this.height * 0.1;
                    }
                    particle.age = 0;
                    particle.baseOpacity = 0.7 + Math.random() * 0.3;
                    particle.flickerPhase = Math.random() * Math.PI * 2;
                } else {
                    // Update position (relative to car)
                    particle.x += particle.vx * (deltaTime / 16); // Normalize to 60fps
                    particle.y += particle.vy * (deltaTime / 16);
                    
                    // Flickering effect using sine wave
                    const flickerSpeed = 0.02; // Speed of flickering
                    particle.flickerPhase += flickerSpeed * (deltaTime / 16);
                    const flickerAmount = 0.3; // Amount of flicker variation
                    const flicker = Math.sin(particle.flickerPhase) * flickerAmount;
                    
                    // Fade out over lifetime with flickering
                    const lifeRatio = particle.age / particle.lifetime;
                    const baseFade = 1 - lifeRatio;
                    particle.currentOpacity = Math.max(0, particle.baseOpacity * baseFade * (1 + flicker));
                    
                    // Size variation for flickering
                    const sizeFlicker = Math.sin(particle.flickerPhase * 1.3) * 0.2;
                    particle.currentSize = particle.baseSize * (1 + sizeFlicker);
                }
            }
        }
    }

    /**
     * Update trash can fire particles
     */
    updateTrashCanFireParticles() {
        const now = Date.now();
        if (!this.lastUpdateTime) {
            this.lastUpdateTime = now;
            return;
        }
        
        const deltaTime = Math.min(now - this.lastUpdateTime, 100); // Cap deltaTime to prevent large jumps
        this.lastUpdateTime = now;
        
        // Update fire particles
        if (this.fireParticles && this.fireParticles.length > 0) {
            for (let i = 0; i < this.fireParticles.length; i++) {
                const particle = this.fireParticles[i];
                
                // Update age
                particle.age += deltaTime;
                
                // Respawn if expired (at top center of trash can)
                if (particle.age >= particle.lifetime) {
                    particle.x = (Math.random() - 0.5) * this.width * 0.3;
                    particle.y = -this.height * 0.4;
                    particle.age = 0;
                    particle.baseOpacity = 0.7 + Math.random() * 0.3;
                    particle.flickerPhase = Math.random() * Math.PI * 2;
                } else {
                    // Update position (relative to trash can)
                    particle.x += particle.vx * (deltaTime / 16); // Normalize to 60fps
                    particle.y += particle.vy * (deltaTime / 16);
                    
                    // Flickering effect using sine wave
                    const flickerSpeed = 0.02; // Speed of flickering
                    particle.flickerPhase += flickerSpeed * (deltaTime / 16);
                    const flickerAmount = 0.3; // Amount of flicker variation
                    const flicker = Math.sin(particle.flickerPhase) * flickerAmount;
                    
                    // Fade out over lifetime with flickering
                    const lifeRatio = particle.age / particle.lifetime;
                    const baseFade = 1 - lifeRatio;
                    particle.currentOpacity = Math.max(0, particle.baseOpacity * baseFade * (1 + flicker));
                    
                    // Size variation for flickering
                    const sizeFlicker = Math.sin(particle.flickerPhase * 1.3) * 0.2;
                    particle.currentSize = particle.baseSize * (1 + sizeFlicker);
                }
            }
        }
    }

    /**
     * Render the prop on the canvas
     */
    draw() {
        ctx.save();
        
        // Translate to prop position and rotate
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw based on type
        switch (this.type) {
            case 'rock':
                this.drawRock();
                break;
            case 'debris':
                this.drawDebris();
                break;
            case 'burntCar':
                this.drawBurntCar();
                break;
            case 'skull':
                this.drawSkull();
                break;
            case 'zombieArms':
                this.drawZombieArms();
                break;
            case 'zombieLegs':
                this.drawZombieLegs();
                break;
            case 'trashCan':
                this.drawTrashCan();
                break;
            case 'explosiveBarrel':
                this.drawExplosiveBarrel();
                break;
            case 'abandonedMotorbike':
                this.drawAbandonedMotorbike();
                break;
            case 'sandbagBarricade':
                this.drawSandbagBarricade();
                break;
            case 'medicalCrate':
                this.drawMedicalCrate();
                break;
            case 'concreteBarrier':
                this.drawConcreteBarrier();
                break;
            case 'ammoCrate':
                this.drawAmmoCrate();
                break;
        }
        
        ctx.restore();
    }

    /**
     * Draw a rock prop
     */
    drawRock() {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        
        // 1. Main body (Jagged Polygon)
        if (this.vertices && this.vertices.length > 0) {
            // Gradient for 3D volume effect
            const rockGradient = ctx.createRadialGradient(-halfWidth*0.3, -halfHeight*0.3, 0, 0, 0, Math.max(halfWidth, halfHeight));
            rockGradient.addColorStop(0, '#7a7a7a'); // Highlight
            rockGradient.addColorStop(1, '#3a3a3a'); // Shadow
            
            ctx.fillStyle = rockGradient;
            ctx.beginPath();
            ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
            for (let i = 1; i < this.vertices.length; i++) {
                ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
            }
            ctx.closePath();
            ctx.fill();
            
            // Outline
            ctx.strokeStyle = this.outlineColor;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            // 2. Texture/Cracks
            if (this.cracks) {
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
                for(const crack of this.cracks) {
                    ctx.lineWidth = crack.width;
                    ctx.beginPath();
                    // Draw a jagged line for the crack
                    const startX = crack.x - Math.cos(crack.angle) * crack.length/2;
                    const startY = crack.y - Math.sin(crack.angle) * crack.length/2;
                    const endX = crack.x + Math.cos(crack.angle) * crack.length/2;
                    const endY = crack.y + Math.sin(crack.angle) * crack.length/2;
                    
                    // Add a mid-point deviation
                    const midX = (startX + endX) / 2 + crack.midOffsetX;
                    const midY = (startY + endY) / 2 + crack.midOffsetY;
                    
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(midX, midY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                }
            }
            
            // 3. Highlight edge (pseudo-rim lighting)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            // Draw highlight on top-left vertices
            const limit = Math.floor(this.vertices.length / 2);
            // Find top-left-most vertex to start (roughly) - actually just drawing first half usually covers top-left due to generation order? 
            // Vertices generated by angle 0 to 2PI. 0 is Right, PI/2 is Down. 
            // So we want roughly PI to 3PI/2 (Left to Top). That's indices around length/2 to 3*length/4.
            // Let's just draw a simple arc highlight for consistency
            ctx.beginPath();
            ctx.arc(-halfWidth*0.1, -halfHeight*0.1, halfWidth*0.7, Math.PI, Math.PI*1.5);
            ctx.stroke();
            
        } else {
            // Fallback to old circle method if vertices missing
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, halfWidth, halfHeight, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = this.outlineColor;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    /**
     * Draw debris prop
     */
    drawDebris() {
        // Draw scattered pieces
        if (this.debrisPieces && this.debrisPieces.length > 0) {
            for(const piece of this.debrisPieces) {
                ctx.save();
                ctx.translate(piece.x, piece.y);
                ctx.rotate(piece.rot);
                
                ctx.fillStyle = piece.color || this.color;
                ctx.fillRect(-piece.w/2, -piece.h/2, piece.w, piece.h);
                
                ctx.strokeStyle = this.outlineColor;
                ctx.lineWidth = 1;
                ctx.strokeRect(-piece.w/2, -piece.h/2, piece.w, piece.h);
                
                ctx.restore();
            }
        } else {
            // Fallback
            const halfWidth = this.width / 2;
            const halfHeight = this.height / 2;
            ctx.fillStyle = this.color;
            ctx.fillRect(-halfWidth, -halfHeight, this.width, this.height);
            ctx.strokeStyle = this.outlineColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(-halfWidth, -halfHeight, this.width, this.height);
        }
    }

    /**
     * Draw burnt car prop with enhanced details and smoke
     */
    drawBurntCar() {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        
        // Shadow underneath
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.ellipse(0, 0, halfWidth * 1.1, halfHeight * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Car body (slightly irregular rectangular shape for damage)
        // We'll use a path instead of rect to allow for dents
        ctx.fillStyle = this.color;
        ctx.beginPath();
        
        // Front (Top in this orientation usually, but let's assume standard)
        // Top-left
        ctx.moveTo(-halfWidth, -halfHeight * 0.8); 
        // Hood curve
        ctx.quadraticCurveTo(0, -halfHeight * 1.05, halfWidth, -halfHeight * 0.8);
        // Right side (with dents)
        ctx.lineTo(halfWidth, -halfHeight * 0.4);
        ctx.lineTo(halfWidth * 0.95, 0); // Dent
        ctx.lineTo(halfWidth, halfHeight * 0.4);
        // Trunk/Rear
        ctx.lineTo(halfWidth * 0.9, halfHeight);
        ctx.lineTo(-halfWidth * 0.9, halfHeight);
        // Left side
        ctx.lineTo(-halfWidth, halfHeight * 0.4);
        ctx.lineTo(-halfWidth * 0.95, 0); // Dent
        ctx.lineTo(-halfWidth, -halfHeight * 0.4);
        ctx.closePath();
        ctx.fill();
        
        // Charred texture gradient overlay
        const gradient = ctx.createLinearGradient(-halfWidth, -halfHeight, halfWidth, halfHeight);
        gradient.addColorStop(0, 'rgba(10, 10, 10, 0.6)');
        gradient.addColorStop(0.5, 'rgba(40, 40, 40, 0.3)');
        gradient.addColorStop(1, 'rgba(10, 10, 10, 0.6)');
        ctx.fillStyle = gradient;
        ctx.fill(); // Fill the same path again
        
        // Outline
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Hood details (damaged)
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-halfWidth * 0.7, -halfHeight * 0.8);
        ctx.lineTo(-halfWidth * 0.6, -halfHeight * 0.5); // Bent hood line
        ctx.lineTo(halfWidth * 0.6, -halfHeight * 0.5);
        ctx.lineTo(halfWidth * 0.7, -halfHeight * 0.8);
        ctx.stroke();
        
        // Roof / Cabin area
        const roofWidth = halfWidth * 0.85;
        const roofHeight = halfHeight * 0.6;
        const roofY = 0;
        
        ctx.fillStyle = '#151515';
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-roofWidth/2, roofY - roofHeight/2, roofWidth, roofHeight, 5);
        } else {
            ctx.rect(-roofWidth/2, roofY - roofHeight/2, roofWidth, roofHeight);
        }
        ctx.fill();
        ctx.stroke();

        // Shattered Windows
        ctx.fillStyle = '#050505'; // Dark interior
        
        // Front Windshield
        this.drawShatteredWindow(0, -roofHeight/2, roofWidth * 0.9, roofHeight * 0.25, true, this.frontWindowCracks);
        
        // Rear Window
        this.drawShatteredWindow(0, roofHeight/2, roofWidth * 0.9, roofHeight * 0.2, false, this.rearWindowCracks);
        
        // Wheels (circles with rims) - slightly askew
        ctx.fillStyle = '#0a0a0a';
        const wheelWidth = halfWidth * 0.25; // Wider tires
        const wheelLength = halfHeight * 0.35; // Longer tires
        const wheelY = halfHeight * 0.6;
        const wheelYFront = -halfHeight * 0.6;
        
        // Helper for wheel
        const drawWheel = (x, y, angleOffset) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angleOffset); // Damaged suspension
            
            // Tire rubber (dark grey with gradient)
            const tireGradient = ctx.createLinearGradient(-wheelWidth/2, 0, wheelWidth/2, 0);
            tireGradient.addColorStop(0, '#050505');
            tireGradient.addColorStop(0.2, '#2a2a2a'); // Highlight
            tireGradient.addColorStop(0.5, '#1a1a1a');
            tireGradient.addColorStop(0.8, '#2a2a2a'); // Highlight
            tireGradient.addColorStop(1, '#050505');
            ctx.fillStyle = tireGradient;
            
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(-wheelWidth/2, -wheelLength/2, wheelWidth, wheelLength, 4);
            else ctx.rect(-wheelWidth/2, -wheelLength/2, wheelWidth, wheelLength);
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Tire Treads
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for(let i = -wheelLength/2 + 4; i < wheelLength/2; i+=6) {
                ctx.moveTo(-wheelWidth/2 + 2, i);
                ctx.lineTo(wheelWidth/2 - 2, i);
            }
            ctx.stroke();
            
            ctx.restore();
        };

        // Move wheels further out to "pop out"
        const wheelOffsetX = halfWidth * 1.05; 
        
        drawWheel(-wheelOffsetX, wheelY, 0.1); // Rear Left
        drawWheel(wheelOffsetX, wheelY, -0.1); // Rear Right
        drawWheel(-wheelOffsetX, wheelYFront, -0.05); // Front Left
        drawWheel(wheelOffsetX, wheelYFront, 0.05); // Front Right
        
        // Burnt/Rust patches
        ctx.fillStyle = 'rgba(139, 69, 19, 0.3)'; // Rust
        if (this.rustPatches) {
            for(const patch of this.rustPatches) {
                ctx.beginPath();
                ctx.arc(patch.x, patch.y, patch.radius, 0, Math.PI*2);
                ctx.fill();
            }
        }
        
        // Draw fire particles (before smoke for proper layering)
        if (this.fireParticles && this.fireParticles.length > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen'; // Additive blending for fire glow
            
            for (const particle of this.fireParticles) {
                // Ensure particle has valid properties before rendering
                if (!particle || particle.currentOpacity <= 0 || !particle.currentSize) continue;
                
                // Use relative coordinates if available (x,y are relative to car center in constructor/update)
                // The drawBurntCar function is already inside a context translated to this.x, this.y
                // But particle positions are stored relative to the car center (0,0)
                
                const fireX = particle.x;
                const fireY = particle.y;
                
                // Fire gradient (bright center, transparent edges)
                const fireGradient = ctx.createRadialGradient(
                    fireX, fireY, 0,
                    fireX, fireY, particle.currentSize
                );
                
                // Convert hex color to rgba for gradient
                const colorMap = {
                    '#ff6600': 'rgba(255, 102, 0,',
                    '#ff8800': 'rgba(255, 136, 0,',
                    '#ffaa00': 'rgba(255, 170, 0,',
                    '#ffff00': 'rgba(255, 255, 0,',
                    '#ff4400': 'rgba(255, 68, 0,',
                    '#ff0000': 'rgba(255, 0, 0,'
                };
                const baseColor = colorMap[particle.color] || 'rgba(255, 102, 0,';
                
                // Fix alpha values to be within 0-1 range
                const alpha1 = Math.max(0, Math.min(1, particle.currentOpacity));
                const alpha2 = Math.max(0, Math.min(1, particle.currentOpacity * 0.8));
                const alpha3 = Math.max(0, Math.min(1, particle.currentOpacity * 0.4));
                
                fireGradient.addColorStop(0, `${baseColor}${alpha1})`);
                fireGradient.addColorStop(0.3, `${baseColor}${alpha2})`);
                fireGradient.addColorStop(0.6, `${baseColor}${alpha3})`);
                fireGradient.addColorStop(1, `${baseColor}0)`);
                
                ctx.fillStyle = fireGradient;
                ctx.beginPath();
                ctx.arc(fireX, fireY, particle.currentSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
        
        // Draw smoke particles
        if (this.smokeParticles && this.smokeParticles.length > 0) {
            for (const particle of this.smokeParticles) {
                // Ensure particle has valid properties
                if (!particle || particle.currentOpacity <= 0 || !particle.size) continue;
                
                const smokeX = particle.x;
                const smokeY = particle.y;
                
                // Fix alpha values to be within 0-1 range
                const alpha1 = Math.max(0, Math.min(1, particle.currentOpacity));
                const alpha2 = Math.max(0, Math.min(1, particle.currentOpacity * 0.7));
                
                // Smoke gradient (white to gray)
                const smokeGradient = ctx.createRadialGradient(
                    smokeX, smokeY, 0,
                    smokeX, smokeY, particle.size
                );
                smokeGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha1})`);
                smokeGradient.addColorStop(0.5, `rgba(200, 200, 200, ${alpha2})`);
                smokeGradient.addColorStop(1, `rgba(150, 150, 150, 0)`);
                
                ctx.fillStyle = smokeGradient;
                ctx.beginPath();
                ctx.arc(smokeX, smokeY, particle.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    /**
     * Helper to draw a shattered window
     */
    drawShatteredWindow(x, y, width, height, isFront, crackData) {
        ctx.save();
        ctx.translate(x, y);
        
        // Window base
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        if (isFront) {
            // Trapezoid shape for windshield
            ctx.moveTo(-width/2, -height/2); // Top-left (wider)
            ctx.lineTo(width/2, -height/2);  // Top-right
            ctx.lineTo(width/2 * 0.8, height/2);   // Bottom-right (narrower)
            ctx.lineTo(-width/2 * 0.8, height/2);  // Bottom-left
        } else {
            // Rear window
            ctx.moveTo(-width/2 * 0.8, -height/2);
            ctx.lineTo(width/2 * 0.8, -height/2);
            ctx.lineTo(width/2, height/2);
            ctx.lineTo(-width/2, height/2);
        }
        ctx.closePath();
        ctx.fill();
        
        // Crack lines
        if (crackData) {
            ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            
            const { centerX, centerY, lines } = crackData;
            
            // Radial lines
            for(const angle of lines) {
                const len = Math.min(width, height) * 0.4;
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(centerX + Math.cos(angle) * len, centerY + Math.sin(angle) * len);
            }
            // Concentric lines (rough)
            ctx.moveTo(centerX + 5, centerY);
            ctx.arc(centerX, centerY, 5, 0, Math.PI*2);
            ctx.moveTo(centerX + 10, centerY);
            ctx.arc(centerX, centerY, 10, 0, Math.PI*2);
            
            ctx.stroke();
        }
        ctx.restore();
    }

    /**
     * Draw a zombie skull prop with enhanced detail and glow effects
     */
    drawSkull() {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        
        // Outer glow effect
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(200, 255, 150, 0.3)';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Main skull shape (oval) with subtle color variation
        const boneGradient = ctx.createRadialGradient(0, -halfHeight * 0.2, 0, 0, 0, halfWidth);
        boneGradient.addColorStop(0, '#f0f0e8'); // Slightly brighter at top
        boneGradient.addColorStop(0.5, this.color); // Base bone white
        boneGradient.addColorStop(1, '#d8d8d0'); // Slightly yellow/brown tint at edges
        ctx.fillStyle = boneGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, halfWidth, halfHeight, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Thicker outline for more definition
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, halfWidth, halfHeight, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Enhanced eye sockets with depth and inner glow
        ctx.save();
        // Inner glow for eye sockets
        const eyeGlowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, halfWidth * 0.2);
        eyeGlowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        eyeGlowGradient.addColorStop(0.5, 'rgba(20, 20, 20, 0.6)');
        eyeGlowGradient.addColorStop(1, 'rgba(42, 42, 42, 0.4)');
        
        // Left eye socket
        ctx.fillStyle = eyeGlowGradient;
        ctx.beginPath();
        ctx.ellipse(-halfWidth * 0.25, -halfHeight * 0.15, halfWidth * 0.15, halfHeight * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Right eye socket
        ctx.beginPath();
        ctx.ellipse(halfWidth * 0.25, -halfHeight * 0.15, halfWidth * 0.15, halfHeight * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye socket outlines
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(-halfWidth * 0.25, -halfHeight * 0.15, halfWidth * 0.15, halfHeight * 0.2, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(halfWidth * 0.25, -halfHeight * 0.15, halfWidth * 0.15, halfHeight * 0.2, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        
        // Cheekbone definition
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-halfWidth * 0.35, halfHeight * 0.1);
        ctx.lineTo(-halfWidth * 0.45, halfHeight * 0.25);
        ctx.moveTo(halfWidth * 0.35, halfHeight * 0.1);
        ctx.lineTo(halfWidth * 0.45, halfHeight * 0.25);
        ctx.stroke();
        
        // Enhanced nasal cavity with depth
        const nasalGradient = ctx.createRadialGradient(0, halfHeight * 0.1, 0, 0, halfHeight * 0.1, halfWidth * 0.15);
        nasalGradient.addColorStop(0, '#1a1a1a');
        nasalGradient.addColorStop(0.5, '#2a2a2a');
        nasalGradient.addColorStop(1, '#3a3a3a');
        ctx.fillStyle = nasalGradient;
        ctx.beginPath();
        ctx.ellipse(0, halfHeight * 0.1, halfWidth * 0.1, halfHeight * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Nasal cavity outline
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, halfHeight * 0.1, halfWidth * 0.1, halfHeight * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Jaw line
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, halfHeight * 0.6, halfWidth * 0.4, 0, Math.PI);
        ctx.stroke();
        
        // Teeth along jaw line
        ctx.fillStyle = '#f5f5f0'; // Slightly whiter than bone
        const toothCount = 6;
        const jawStartAngle = 0;
        const jawEndAngle = Math.PI;
        const jawRadius = halfWidth * 0.4;
        const jawCenterY = halfHeight * 0.6;
        
        for (let i = 0; i < toothCount; i++) {
            const t = i / (toothCount - 1);
            const angle = jawStartAngle + (jawEndAngle - jawStartAngle) * t;
            const toothX = Math.cos(angle) * jawRadius;
            const toothY = jawCenterY + Math.sin(angle) * jawRadius;
            const toothWidth = halfWidth * 0.08;
            const toothHeight = halfHeight * 0.1;
            
            ctx.beginPath();
            ctx.ellipse(toothX, toothY, toothWidth * 0.5, toothHeight * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Tooth outline
            ctx.strokeStyle = '#c8c8c0';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
        
        // Enhanced cracks with varying thickness and darker fills
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        // Primary cracks
        ctx.moveTo(-halfWidth * 0.3, -halfHeight * 0.3);
        ctx.lineTo(-halfWidth * 0.1, halfHeight * 0.2);
        ctx.moveTo(halfWidth * 0.2, -halfHeight * 0.2);
        ctx.lineTo(halfWidth * 0.3, halfHeight * 0.3);
        ctx.stroke();
        
        // Additional cracks
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-halfWidth * 0.2, -halfHeight * 0.1);
        ctx.lineTo(-halfWidth * 0.35, halfHeight * 0.15);
        ctx.moveTo(halfWidth * 0.15, -halfHeight * 0.25);
        ctx.lineTo(halfWidth * 0.25, 0);
        ctx.moveTo(0, -halfHeight * 0.35);
        ctx.lineTo(halfWidth * 0.1, -halfHeight * 0.1);
        ctx.moveTo(-halfWidth * 0.15, halfHeight * 0.25);
        ctx.lineTo(0, halfHeight * 0.4);
        ctx.stroke();
        
        // Fill cracks with darker color for depth
        ctx.fillStyle = 'rgba(42, 42, 42, 0.6)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(-halfWidth * 0.3, -halfHeight * 0.3);
        ctx.lineTo(-halfWidth * 0.1, halfHeight * 0.2);
        ctx.lineTo(-halfWidth * 0.15, halfHeight * 0.25);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(halfWidth * 0.2, -halfHeight * 0.2);
        ctx.lineTo(halfWidth * 0.3, halfHeight * 0.3);
        ctx.lineTo(halfWidth * 0.25, 0);
        ctx.closePath();
        ctx.fill();
        
        // Bone texture - subtle detail marks (using stored positions)
        ctx.fillStyle = 'rgba(200, 200, 180, 0.3)';
        if (this.textureMarks) {
            for (const mark of this.textureMarks) {
                const texX = mark.x * halfWidth;
                const texY = mark.y * halfHeight;
                ctx.beginPath();
                ctx.arc(texX, texY, mark.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Subtle shadow beneath skull for depth
        ctx.save();
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = halfHeight * 0.3;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.beginPath();
        ctx.ellipse(0, halfHeight * 0.7, halfWidth * 0.6, halfHeight * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /**
     * Draw zombie arms prop with anatomical details
     */
    drawZombieArms() {
        // Draw arms
        for (let i = 0; i < this.armCount; i++) {
            // Position arms relative to prop center
            // Spread them out slightly so they aren't perfectly stacked
            const offsetX = (i - (this.armCount-1)/2) * 15; 
            const offsetY = (i % 2 === 0 ? -1 : 1) * 5;
            
            const props = this.armProps[i];
            const armScale = props.scale;
            const upperArmLen = 18 * armScale;
            const lowerArmLen = 16 * armScale;
            const armThickness = 8 * armScale;
            
            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.rotate(props.rotation);
            ctx.scale(props.flip, 1); // Flip for left/right variation
            
            // --- UPPER ARM ---
            ctx.fillStyle = this.color;
            ctx.strokeStyle = this.outlineColor;
            ctx.lineWidth = 1.5;
            
            // Draw Upper Arm Segment
            ctx.beginPath();
            // Shoulder end (rounded)
            ctx.arc(0, 0, armThickness/2, Math.PI, 0);
            // Down to elbow
            ctx.lineTo(armThickness/2 - 1, upperArmLen);
            ctx.lineTo(-armThickness/2 + 1, upperArmLen);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // --- ELBOW & LOWER ARM ---
            ctx.save();
            ctx.translate(0, upperArmLen - 2); // Pivot at elbow
            ctx.rotate(props.elbowAngle); // Bend
            
            // Draw Lower Arm Segment
            ctx.beginPath();
            ctx.moveTo(-armThickness/2 + 1, 0);
            ctx.lineTo(armThickness/2 - 1, 0);
            // Taper towards wrist
            ctx.lineTo(armThickness/2 - 2, lowerArmLen);
            ctx.lineTo(-armThickness/2 + 2, lowerArmLen);
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.stroke();
            
            // --- HAND ---
            ctx.translate(0, lowerArmLen);
            
            // Palm
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 3, armThickness/2, Math.PI, 0); // Palm heel
            ctx.lineTo(armThickness/2, 8);
            ctx.lineTo(-armThickness/2, 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Fingers
            ctx.fillStyle = this.color;
            const fingerLen = 6 * armScale;
            const fingerWidth = 1.5 * armScale;
            
            // Thumb (angled out)
            ctx.save();
            ctx.translate(-armThickness/2 + 1, 2);
            ctx.rotate(-0.5);
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(0, 0, fingerWidth, fingerLen * 0.8, 1);
            else ctx.rect(0, 0, fingerWidth, fingerLen * 0.8);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
            
            // 3 Main Fingers
            for(let f=0; f<3; f++) {
                ctx.save();
                // Spread fingers slightly
                const fX = -armThickness/3 + (f * armThickness/3);
                const fAngle = (f-1) * 0.1;
                ctx.translate(fX, 8);
                ctx.rotate(fAngle);
                
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(-fingerWidth/2, 0, fingerWidth, fingerLen + (f===1?2:0), 1);
                else ctx.rect(-fingerWidth/2, 0, fingerWidth, fingerLen + (f===1?2:0));
                
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
            
            ctx.restore(); // End Lower Arm
            
            // --- SEVERED END DETAILS (Shoulder) ---
            // Draw bone sticking out
            ctx.fillStyle = '#e8e8e8'; // Bone white
            ctx.beginPath();
            ctx.arc(0, 0, armThickness/4, 0, Math.PI * 2);
            ctx.fill();
            
            // Gore/Blood
            ctx.fillStyle = '#8a0303'; // Dark red blood
            ctx.beginPath();
            // Jagged flesh shape
            for(let k=0; k<props.goreVerts.length; k++) {
                const vert = props.goreVerts[k];
                const angle = vert.angle;
                const r = armThickness/2 + vert.rOffset;
                const gx = Math.cos(angle) * r;
                const gy = Math.sin(angle) * r;
                if (k===0) ctx.moveTo(gx, gy);
                else ctx.lineTo(gx, gy);
            }
            ctx.closePath();
            ctx.fill();
            
            // Some random decay spots on the arm
            ctx.fillStyle = '#4a5a3a'; // Darker decay spot
            ctx.beginPath();
            ctx.arc(0, upperArmLen * 0.4, 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore(); // End Whole Arm
        }
    }

    /**
     * Draw zombie legs prop with anatomical details
     */
    drawZombieLegs() {
        // Draw 2 legs
        for (let i = 0; i < 2; i++) {
            // Position legs relative to prop center
            const offsetX = (i === 0 ? -1 : 1) * 12;
            const offsetY = (i % 2 === 0 ? 1 : -1) * 3;
            
            const props = this.legProps[i];
            const legScale = props.scale;
            const thighLen = 22 * legScale;
            const calfLen = 20 * legScale;
            const legThickness = 10 * legScale;
            
            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.rotate(props.rotation);
            ctx.scale(props.flip, 1);
            
            // --- THIGH ---
            ctx.fillStyle = this.color;
            ctx.strokeStyle = this.outlineColor;
            ctx.lineWidth = 1.5;
            
            ctx.beginPath();
            // Hip end (rounded)
            ctx.arc(0, 0, legThickness/2, Math.PI, 0);
            // Down to knee
            ctx.lineTo(legThickness/2 - 1, thighLen);
            ctx.lineTo(-legThickness/2 + 1, thighLen);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // --- KNEE & CALF ---
            ctx.save();
            ctx.translate(0, thighLen - 2); // Pivot at knee
            ctx.rotate(props.kneeAngle); // Bend
            
            // Draw Calf
            ctx.beginPath();
            ctx.moveTo(-legThickness/2 + 1, 0);
            ctx.lineTo(legThickness/2 - 1, 0);
            // Taper towards ankle
            ctx.lineTo(legThickness/2 - 3, calfLen);
            ctx.lineTo(-legThickness/2 + 3, calfLen);
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.stroke();
            
            // --- FOOT ---
            ctx.translate(0, calfLen);
            ctx.rotate(Math.PI/2); // Feet point out usually
            
            ctx.fillStyle = this.color;
            ctx.beginPath();
            // Heel
            ctx.arc(0, 0, legThickness/2.5, Math.PI/2, -Math.PI/2);
            // Foot length
            ctx.lineTo(12 * legScale, -legThickness/3);
            ctx.lineTo(12 * legScale, legThickness/3);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Toes (simple block or small bumps)
            ctx.fillStyle = this.color;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(12 * legScale, -legThickness/3, 3 * legScale, legThickness * 0.7, 1);
            else ctx.rect(12 * legScale, -legThickness/3, 3 * legScale, legThickness * 0.7);
            ctx.fill();
            ctx.stroke();
            
            ctx.restore(); // End Calf
            
            // --- SEVERED END DETAILS (Hip) ---
            // Bone
            ctx.fillStyle = '#e8e8e8'; // Bone white
            ctx.beginPath();
            ctx.arc(0, 0, legThickness/3, 0, Math.PI * 2);
            ctx.fill();
            
            // Gore
            ctx.fillStyle = '#8a0303'; // Dark red blood
            ctx.beginPath();
            for(let k=0; k<props.goreVerts.length; k++) {
                const vert = props.goreVerts[k];
                const angle = vert.angle;
                const r = legThickness/2 + vert.rOffset;
                const gx = Math.cos(angle) * r;
                const gy = Math.sin(angle) * r;
                if (k===0) ctx.moveTo(gx, gy);
                else ctx.lineTo(gx, gy);
            }
            ctx.closePath();
            ctx.fill();
            
            // Tattered pants fragment (optional detail)
            ctx.fillStyle = '#3a4a5a'; // Dark blue jeans color
            ctx.beginPath();
            ctx.moveTo(-legThickness/2 - 1, 5);
            ctx.lineTo(legThickness/2 + 1, 5);
            ctx.lineTo(legThickness/2 + 2, 12); // Tattered edge
            ctx.lineTo(0, 10);
            ctx.lineTo(-legThickness/2 - 2, 13);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore(); // End Whole Leg
        }
    }

    /**
     * Draw trash can prop with fire effect (2.5D/3D perspective)
     */
    drawTrashCan() {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        const radius = (halfWidth + halfHeight) / 2;
        
        // 3D Perspective: Top ellipse (wider than tall) and bottom ellipse (narrower)
        // Top of cylinder (closer to viewer)
        const topRadiusX = radius;
        const topRadiusY = radius * 0.6; // Flattened ellipse for perspective
        const topY = -radius * 0.7; // Position further above center (lengthened)
        
        // Bottom of cylinder (further from viewer)
        const bottomRadiusX = radius * 0.85; // Slightly smaller (perspective)
        const bottomRadiusY = radius * 0.5; // More flattened
        const bottomY = radius * 1.0; // Position further below center (lengthened)
        
        // Shadow underneath (elliptical for 3D effect)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.ellipse(0, bottomY + radius * 0.2, bottomRadiusX * 1.1, bottomRadiusY * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw fire particles BEFORE lid (so fire appears through gap)
        if (this.fireParticles && this.fireParticles.length > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen'; // Additive blending for fire glow
            
            for (const particle of this.fireParticles) {
                // Ensure particle has valid properties before rendering
                if (!particle || particle.currentOpacity <= 0 || !particle.currentSize) continue;
                
                // Adjust fire position for 3D perspective (fire comes from top opening)
                const fireX = particle.x;
                const fireY = topY + particle.y; // Position relative to top of cylinder
                
                // Fire gradient (bright center, transparent edges)
                const fireGradient = ctx.createRadialGradient(
                    fireX, fireY, 0,
                    fireX, fireY, particle.currentSize
                );
                
                // Convert hex color to rgba for gradient
                const colorMap = {
                    '#ff6600': 'rgba(255, 102, 0,',
                    '#ff8800': 'rgba(255, 136, 0,',
                    '#ffaa00': 'rgba(255, 170, 0,',
                    '#ffaa00': 'rgba(255, 170, 0,',
                    '#ffff00': 'rgba(255, 255, 0,',
                    '#ff4400': 'rgba(255, 68, 0,',
                    '#ff0000': 'rgba(255, 0, 0,'
                };
                const baseColor = colorMap[particle.color] || 'rgba(255, 102, 0,';
                
                // Fix alpha values to be within 0-1 range
                const alpha1 = Math.max(0, Math.min(1, particle.currentOpacity));
                const alpha2 = Math.max(0, Math.min(1, particle.currentOpacity * 0.8));
                const alpha3 = Math.max(0, Math.min(1, particle.currentOpacity * 0.4));
                
                fireGradient.addColorStop(0, `${baseColor}${alpha1})`);
                fireGradient.addColorStop(0.3, `${baseColor}${alpha2})`);
                fireGradient.addColorStop(0.6, `${baseColor}${alpha3})`);
                fireGradient.addColorStop(1, `${baseColor}0)`);
                
                ctx.fillStyle = fireGradient;
                ctx.beginPath();
                ctx.arc(fireX, fireY, particle.currentSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }

        // CYLINDRICAL BODY - 3D Perspective Drawing
        
        // Draw side walls of cylinder (connecting top and bottom ellipses)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        // Left curve (from top left to bottom left)
        ctx.moveTo(-topRadiusX * 0.9, topY);
        ctx.lineTo(-bottomRadiusX * 0.9, bottomY);
        // Bottom curve
        ctx.ellipse(0, bottomY, bottomRadiusX, bottomRadiusY, 0, Math.PI, 0, true);
        // Right curve (from bottom right to top right)
        ctx.lineTo(topRadiusX * 0.9, topY);
        // Top curve
        ctx.ellipse(0, topY, topRadiusX, topRadiusY, 0, 0, Math.PI, true);
        ctx.closePath();
        ctx.fill();
        
        // Side wall shading (darker on right, lighter on left)
        const sideGradient = ctx.createLinearGradient(
            -topRadiusX, 0,
            topRadiusX, 0
        );
        sideGradient.addColorStop(0, 'rgba(74, 106, 47, 0.3)'); // Left highlight
        sideGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)'); // Center transparent
        sideGradient.addColorStop(1, 'rgba(26, 48, 10, 0.6)'); // Right shadow
        
        ctx.fillStyle = sideGradient;
        ctx.fill(); // Fill the same path with gradient overlay
        
        // Top ellipse (top of cylinder - visible opening)
        const topGradient = ctx.createRadialGradient(
            -topRadiusX * 0.3, topY - topRadiusY * 0.3, 0,
            0, topY, topRadiusX
        );
        topGradient.addColorStop(0, '#4a6a2f'); // Highlight
        topGradient.addColorStop(0.5, this.color); // Base
        topGradient.addColorStop(1, '#1a300a'); // Shadow
        
        ctx.fillStyle = topGradient;
        ctx.beginPath();
        ctx.ellipse(0, topY, topRadiusX, topRadiusY, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Top rim (thick edge)
        ctx.strokeStyle = '#4a6a2f';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(0, topY, topRadiusX * 0.95, topRadiusY * 0.95, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Top rim inner edge
        ctx.strokeStyle = '#1a300a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, topY, topRadiusX * 0.88, topRadiusY * 0.88, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Bottom ellipse (base of cylinder) - only draw visible front portion
        ctx.fillStyle = '#1a300a';
        ctx.beginPath();
        // Draw only the front half (visible from this angle) - from left to right
        ctx.ellipse(0, bottomY, bottomRadiusX, bottomRadiusY, 0, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.lineTo(0, bottomY + bottomRadiusY * 0.2);
        ctx.closePath();
        ctx.fill();
        
        // Bottom rim - draw as wrapping around from behind (left) to front (right)
        ctx.strokeStyle = '#4a6a2f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Draw rim starting from behind-left, curving around the bottom front
        // Start from behind (left side at ~210 degrees), curve to front (right side at ~330 degrees)
        ctx.ellipse(0, bottomY, bottomRadiusX * 0.95, bottomRadiusY * 0.95, 0, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        
        // Bottom rim inner edge (visible portion only - same arc)
        ctx.strokeStyle = '#1a300a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, bottomY, bottomRadiusX * 0.88, bottomRadiusY * 0.88, 0, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        
        // Horizontal metal bands (elliptical rings with perspective)
        ctx.strokeStyle = '#3a5a1f';
        ctx.lineWidth = 1.5;
        // Top band (near top)
        const band1Y = topY + (bottomY - topY) * 0.3;
        const band1RX = topRadiusX * 0.9 - (topRadiusX - bottomRadiusX) * 0.3;
        const band1RY = topRadiusY * 0.9 - (topRadiusY - bottomRadiusY) * 0.3;
        ctx.beginPath();
        ctx.ellipse(0, band1Y, band1RX, band1RY, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Middle band
        const band2Y = topY + (bottomY - topY) * 0.5;
        const band2RX = topRadiusX * 0.92 - (topRadiusX - bottomRadiusX) * 0.5;
        const band2RY = topRadiusY * 0.92 - (topRadiusY - bottomRadiusY) * 0.5;
        ctx.beginPath();
        ctx.ellipse(0, band2Y, band2RX, band2RY, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Bottom band (near bottom)
        const band3Y = topY + (bottomY - topY) * 0.7;
        const band3RX = topRadiusX * 0.9 - (topRadiusX - bottomRadiusX) * 0.7;
        const band3RY = topRadiusY * 0.9 - (topRadiusY - bottomRadiusY) * 0.7;
        ctx.beginPath();
        ctx.ellipse(0, band3Y, band3RX, band3RY, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Vertical highlight line (left side - brightest)
        ctx.strokeStyle = 'rgba(74, 106, 47, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-topRadiusX * 0.85, topY);
        ctx.lineTo(-bottomRadiusX * 0.85, bottomY);
        ctx.stroke();
        
        // Vertical shadow line (right side - darkest)
        ctx.strokeStyle = 'rgba(26, 48, 10, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(topRadiusX * 0.85, topY);
        ctx.lineTo(bottomRadiusX * 0.85, bottomY);
        ctx.stroke();
        
        // Outline (top and bottom ellipses)
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, topY, topRadiusX, topRadiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Bottom outline - only visible front portion
        ctx.beginPath();
        ctx.ellipse(0, bottomY, bottomRadiusX, bottomRadiusY, 0, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.stroke();
        
        // Lid (slightly open arc at top - 3D perspective)
        ctx.fillStyle = '#1a300a';
        ctx.strokeStyle = '#2d5016';
        ctx.lineWidth = 1.5;
        
        // Lid body (arc shape with perspective)
        ctx.beginPath();
        const lidStartAngle = Math.PI - this.lidOpenAngle;
        const lidEndAngle = Math.PI + this.lidOpenAngle;
        ctx.ellipse(0, topY, topRadiusX * 0.9, topRadiusY * 0.9, 0, lidStartAngle, lidEndAngle);
        ctx.lineTo(0, topY - topRadiusY * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Lid handle/rim detail
        ctx.strokeStyle = '#4a6a2f';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, topY, topRadiusX * 0.9, topRadiusY * 0.9, 0, lidStartAngle, lidEndAngle);
        ctx.stroke();
        
        // Lid highlight (left side of lid)
        ctx.strokeStyle = 'rgba(74, 106, 47, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-topRadiusX * 0.7, topY);
        ctx.lineTo(-topRadiusX * 0.5, topY - topRadiusY * 0.1);
        ctx.stroke();
        
        // Dents/scratches
        if (this.dents) {
            ctx.fillStyle = 'rgba(26, 48, 10, 0.6)';
            for (const dent of this.dents) {
                ctx.beginPath();
                ctx.arc(dent.x, dent.y, dent.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    takeDamage(amount, source) {
        if (this.type !== 'explosiveBarrel' || this.detonated) return;

        this.health -= amount;

        // Track the player who caused this damage
        if (source) {
            if (source.inputSource) {
                this.lastDamagedByPlayer = source;
            } else if (source.player) {
                this.lastDamagedByPlayer = source.player;
            }
        }

        // Spawn metal sparks
        const sparksColor = '#e0a020';
        import('../systems/ParticleSystem.js').then(m => {
            m.createParticles(this.x, this.y, sparksColor, 4);
        }).catch(err => {});

        if (this.health <= 0 && !this.ignited) {
            this.ignited = true;
            this.ignitedTime = Date.now();
        }
    }

    updateExplosiveBarrel() {
        const now = Date.now();
        const elapsed = now - this.ignitedTime;

        // Spawn fire/smoke particles while ignited
        if (Math.random() < 0.45) {
            import('../systems/ParticleSystem.js').then(m => {
                m.spawnParticle(
                    this.x + (Math.random() - 0.5) * 15,
                    this.y - this.height * 0.4,
                    ['#ff3300', '#ff8800', '#ffff00'][Math.floor(Math.random() * 3)],
                    {
                        vx: (Math.random() - 0.5) * 1.5,
                        vy: -2 - Math.random() * 2,
                        lifetime: 400 + Math.random() * 300,
                        size: 4 + Math.random() * 4
                    }
                );
            }).catch(err => {});
        }

        if (elapsed >= this.fuseTime) {
            this.detonated = true;
            
            // Trigger explosion
            import('../utils/combatUtils.js').then(module => {
                module.triggerExplosion(this.x, this.y, 100, 75, true, this.lastDamagedByPlayer, true);
            }).catch(err => {});
        }
    }

    drawExplosiveBarrel() {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;

        if (this.detonated) {
            // Flattened charred wreckage
            ctx.fillStyle = '#1a1a1a';
            ctx.strokeStyle = '#0a0a0a';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.ellipse(0, 0, halfWidth * 1.2, halfHeight * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#111111';
            ctx.beginPath();
            ctx.ellipse(0, 0, halfWidth * 0.8, halfHeight * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#050505';
            ctx.fillRect(-halfWidth * 0.5, -halfHeight * 0.3, 4, 3);
            ctx.fillRect(halfWidth * 0.4, halfHeight * 0.1, 3, 3);
            return;
        }

        let baseColor = '#b32424';
        let stripeColor = '#ffffff';
        
        if (this.ignited) {
            const flash = Math.floor(Date.now() / 100) % 2 === 0;
            baseColor = flash ? '#ff4444' : '#ffffff';
            stripeColor = flash ? '#ffffff' : '#ff4444';
        }

        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.roundRect(-halfWidth, -halfHeight, this.width, this.height, 4);
        ctx.fill();

        ctx.strokeStyle = '#4a0e0e';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(-halfWidth, -halfHeight * 0.4);
        ctx.lineTo(halfWidth, -halfHeight * 0.4);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-halfWidth, halfHeight * 0.4);
        ctx.lineTo(halfWidth, halfHeight * 0.4);
        ctx.stroke();

        ctx.fillStyle = stripeColor;
        ctx.fillRect(-halfWidth, -halfHeight * 0.15, this.width, halfHeight * 0.3);

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-2, -2); ctx.lineTo(2, 2);
        ctx.moveTo(2, -2); ctx.lineTo(-2, 2);
        ctx.stroke();

        ctx.strokeStyle = '#1a0505';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-halfWidth, -halfHeight, this.width, this.height, 4);
        ctx.stroke();
    }

    initMotorbikeDetails() {
        const hw = this.width / 2;
        const hh = this.height / 2;
        this.rustPatches = [];
        for (let i = 0; i < 4; i++) {
            this.rustPatches.push({
                x: (Math.random() - 0.5) * hw * 1.4,
                y: (Math.random() - 0.5) * hh * 1.2,
                rx: 4 + Math.random() * 8,
                ry: 3 + Math.random() * 5,
                rot: Math.random() * 0.5,
                alpha: 0.25 + Math.random() * 0.15
            });
        }
        this.oilStain = {
            x: hw * 0.3 * this.fallenSide,
            y: hh * 0.6,
            rx: hw * 0.35,
            ry: hh * 0.25
        };
        this.chainLinks = [];
        for (let i = 0; i < 8; i++) {
            this.chainLinks.push({
                x: -hw * 0.15 + i * (hw * 0.04),
                y: hh * 0.15 + Math.sin(i * 0.8) * 2
            });
        }
        this.flatTire = Math.random() > 0.4;
        this.mirrorBroken = Math.random() > 0.3;
        this.seatTorn = Math.random() > 0.35;
    }

    initSandbagDetails() {
        const hw = this.width / 2;
        const hh = this.height / 2;
        this.bags = [];
        const rows = 3;
        const cols = 4 + Math.floor(Math.random() * 2);
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols - row; col++) {
                const bagW = hw * 0.38;
                const bagH = hh * 0.32;
                const offsetX = (col - (cols - row - 1) / 2) * bagW * 0.92;
                const offsetY = hh * 0.35 - row * bagH * 0.75;
                this.bags.push({
                    x: offsetX + (Math.random() - 0.5) * 3,
                    y: offsetY,
                    w: bagW * (0.9 + Math.random() * 0.15),
                    h: bagH * (0.85 + Math.random() * 0.2),
                    shade: 0.75 + Math.random() * 0.25,
                    seamAngle: (Math.random() - 0.5) * 0.15
                });
            }
        }
        this.bulletHoles = [];
        const holeCount = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < holeCount; i++) {
            this.bulletHoles.push({
                x: (Math.random() - 0.5) * hw * 1.2,
                y: (Math.random() - 0.5) * hh * 0.6,
                r: 1.5 + Math.random() * 2
            });
        }
        this.barbWireLoops = 5 + Math.floor(Math.random() * 3);
        this.hasCautionTape = Math.random() > 0.4;
        this.bloodSplatters = [];
        for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
            this.bloodSplatters.push({
                x: (Math.random() - 0.5) * hw,
                y: hh * 0.2 + Math.random() * hh * 0.3,
                r: 3 + Math.random() * 5,
                rot: Math.random() * Math.PI
            });
        }
    }

    initMedicalCrateDetails() {
        const hw = this.width / 2;
        const hh = this.height / 2;
        this.crateAngle = 0.25 + Math.random() * 0.35;
        this.lidDetached = Math.random() > 0.35;
        this.spilledItems = [];
        const itemTypes = ['bandage', 'syringe', 'bottle', 'gauze'];
        const count = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < count; i++) {
            this.spilledItems.push({
                type: itemTypes[Math.floor(Math.random() * itemTypes.length)],
                x: hw * 0.2 + Math.random() * hw * 0.9,
                y: hh * 0.1 + Math.random() * hh * 0.5,
                rot: Math.random() * Math.PI * 2,
                scale: 0.7 + Math.random() * 0.5
            });
        }
        this.bloodStains = [];
        for (let i = 0; i < 3; i++) {
            this.bloodStains.push({
                x: (Math.random() - 0.5) * hw * 0.8,
                y: (Math.random() - 0.5) * hh * 0.6,
                rx: 4 + Math.random() * 10,
                ry: 3 + Math.random() * 6,
                rot: Math.random() * Math.PI
            });
        }
        this.crossDamaged = Math.random() > 0.45;
        this.woodCracks = [];
        for (let i = 0; i < 3; i++) {
            this.woodCracks.push({
                x1: (Math.random() - 0.5) * hw,
                y1: (Math.random() - 0.5) * hh,
                x2: (Math.random() - 0.5) * hw,
                y2: (Math.random() - 0.5) * hh
            });
        }
    }

    initConcreteBarrierDetails() {
        const hw = this.width / 2;
        const hh = this.height / 2;
        this.rebarExposed = Math.random() > 0.35;
        this.rebarPieces = [];
        if (this.rebarExposed) {
            const count = 2 + Math.floor(Math.random() * 3);
            for (let i = 0; i < count; i++) {
                this.rebarPieces.push({
                    x: hw * 0.3 + Math.random() * hw * 0.4,
                    y: -hh * 0.2 + Math.random() * hh * 0.3,
                    len: 8 + Math.random() * 14,
                    angle: -0.3 + Math.random() * 0.6,
                    bent: Math.random() > 0.5
                });
            }
        }
        this.cracks = [];
        for (let i = 0; i < 4 + Math.floor(Math.random() * 3); i++) {
            this.cracks.push({
                x: (Math.random() - 0.5) * hw * 0.9,
                y: (Math.random() - 0.5) * hh * 0.7,
                len: 6 + Math.random() * 14,
                angle: Math.random() * Math.PI * 2,
                branches: 1 + Math.floor(Math.random() * 2)
            });
        }
        this.graffitiColor = ['#e040fb', '#ff5722', '#ffeb3b', '#00bcd4'][Math.floor(Math.random() * 4)];
        this.graffitiText = ['DEAD', 'RUN', 'HELP', 'RIOT', '666'][Math.floor(Math.random() * 5)];
        this.handprint = {
            x: -hw * 0.35 + Math.random() * hw * 0.3,
            y: hh * 0.05,
            scale: 0.8 + Math.random() * 0.4,
            rot: (Math.random() - 0.5) * 0.5
        };
        this.chipDamage = [];
        for (let i = 0; i < 3; i++) {
            this.chipDamage.push({
                x: (Math.random() - 0.5) * hw,
                y: (Math.random() - 0.5) * hh * 0.5,
                w: 4 + Math.random() * 8,
                h: 3 + Math.random() * 5
            });
        }
    }

    initAmmoCrateDetails() {
        const hw = this.width / 2;
        const hh = this.height / 2;
        this.lidOpen = true;
        this.lidAngle = 0.4 + Math.random() * 0.5;
        this.casings = [];
        const casingCount = 8 + Math.floor(Math.random() * 10);
        for (let i = 0; i < casingCount; i++) {
            this.casings.push({
                x: (Math.random() - 0.5) * hw * 1.6,
                y: hh * 0.1 + Math.random() * hh * 0.8,
                rot: Math.random() * Math.PI * 2,
                len: 3 + Math.random() * 2,
                brass: Math.random() > 0.25
            });
        }
        this.beltSegments = [];
        for (let i = 0; i < 6 + Math.floor(Math.random() * 4); i++) {
            this.beltSegments.push({
                x: hw * 0.1 + i * 5,
                y: -hh * 0.1 + Math.sin(i * 0.5) * 3,
                rot: 0.3 + Math.random() * 0.4
            });
        }
        this.stencilWorn = 0.3 + Math.random() * 0.5;
        this.woodSplinters = [];
        for (let i = 0; i < 4; i++) {
            this.woodSplinters.push({
                x: -hw * 0.3 + Math.random() * hw * 0.2,
                y: -hh * 0.2 + Math.random() * hh * 0.3,
                len: 4 + Math.random() * 6,
                angle: Math.random() * Math.PI * 2
            });
        }
    }

    drawAbandonedMotorbike() {
        const hw = this.width / 2;
        const hh = this.height / 2;
        const side = this.fallenSide;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(hw * 0.1 * side, hh * 0.55, hw * 0.85, hh * 0.35, 0.1, 0, Math.PI * 2);
        ctx.fill();

        if (this.oilStain) {
            ctx.fillStyle = 'rgba(20, 20, 15, 0.55)';
            ctx.beginPath();
            ctx.ellipse(this.oilStain.x, this.oilStain.y, this.oilStain.rx, this.oilStain.ry, 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(40, 35, 20, 0.25)';
            ctx.beginPath();
            ctx.ellipse(this.oilStain.x + 2, this.oilStain.y + 1, this.oilStain.rx * 0.6, this.oilStain.ry * 0.5, 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        const drawWheel = (cx, cy, r, flat) => {
            ctx.save();
            ctx.translate(cx, cy);
            const tireGrad = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r);
            tireGrad.addColorStop(0, '#2a2a2a');
            tireGrad.addColorStop(0.7, '#1a1a1a');
            tireGrad.addColorStop(1, '#0a0a0a');
            ctx.fillStyle = tireGrad;
            ctx.beginPath();
            if (flat) {
                ctx.ellipse(0, 0, r, r * 0.55, 0, 0, Math.PI * 2);
            } else {
                ctx.arc(0, 0, r, 0, Math.PI * 2);
            }
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.strokeStyle = 'rgba(80,80,80,0.5)';
            ctx.lineWidth = 1;
            for (let t = 0; t < 8; t++) {
                const a = (t / 8) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
                ctx.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
                ctx.stroke();
            }
            ctx.fillStyle = '#4a4a4a';
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#2a2a2a';
            ctx.lineWidth = 1;
            for (let s = 0; s < 5; s++) {
                const a = (s / 5) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3);
                ctx.stroke();
            }
            ctx.restore();
        };

        drawWheel(-hw * 0.55, hh * 0.05, hh * 0.42, false);
        drawWheel(hw * 0.5, hh * 0.1, hh * 0.42, this.flatTire);

        const frameGrad = ctx.createLinearGradient(-hw, 0, hw, 0);
        frameGrad.addColorStop(0, '#4a4a4a');
        frameGrad.addColorStop(0.5, '#2a2a2a');
        frameGrad.addColorStop(1, '#1a1a1a');
        ctx.strokeStyle = frameGrad;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-hw * 0.5, hh * 0.05);
        ctx.lineTo(-hw * 0.1, -hh * 0.15);
        ctx.lineTo(hw * 0.15, -hh * 0.2);
        ctx.lineTo(hw * 0.45, hh * 0.05);
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.1, -hh * 0.15);
        ctx.lineTo(hw * 0.05, hh * 0.15);
        ctx.stroke();

        const tankGrad = ctx.createLinearGradient(-hw * 0.05, -hh * 0.35, hw * 0.2, -hh * 0.05);
        tankGrad.addColorStop(0, '#5a2020');
        tankGrad.addColorStop(0.5, '#8b3030');
        tankGrad.addColorStop(1, '#3a1515');
        ctx.fillStyle = tankGrad;
        ctx.beginPath();
        ctx.ellipse(hw * 0.05, -hh * 0.2, hw * 0.18, hh * 0.22, -0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2a1010';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#c0c0b0';
        ctx.beginPath();
        ctx.ellipse(hw * 0.12, -hh * 0.28, hw * 0.04, hh * 0.05, 0, 0, Math.PI * 2);
        ctx.fill();

        const seatGrad = ctx.createLinearGradient(0, -hh * 0.1, 0, hh * 0.1);
        seatGrad.addColorStop(0, '#1a1a1a');
        seatGrad.addColorStop(1, '#0a0a0a');
        ctx.fillStyle = seatGrad;
        ctx.beginPath();
        ctx.ellipse(-hw * 0.05, hh * 0.02, hw * 0.2, hh * 0.14, 0.1, 0, Math.PI * 2);
        ctx.fill();
        if (this.seatTorn) {
            ctx.strokeStyle = '#3a2020';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-hw * 0.12, hh * 0.05);
            ctx.lineTo(-hw * 0.02, hh * 0.12);
            ctx.lineTo(hw * 0.05, hh * 0.02);
            ctx.stroke();
            ctx.fillStyle = '#4a3020';
            ctx.beginPath();
            ctx.ellipse(-hw * 0.04, hh * 0.08, 4, 2, 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(hw * 0.15, -hh * 0.2);
        ctx.lineTo(hw * 0.35, -hh * 0.45);
        ctx.lineTo(hw * 0.42, -hh * 0.35);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(hw * 0.42, -hh * 0.35, 3, 0, Math.PI * 2);
        ctx.stroke();
        if (this.mirrorBroken) {
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(hw * 0.38, -hh * 0.42, 5, 3);
        } else {
            ctx.fillStyle = 'rgba(180,200,220,0.4)';
            ctx.fillRect(hw * 0.38, -hh * 0.44, 6, 4);
        }

        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.ellipse(hw * 0.38, hh * 0.12, hw * 0.06, hh * 0.08, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (this.chainLinks) {
            ctx.strokeStyle = '#5a5a5a';
            ctx.lineWidth = 1.2;
            for (let i = 0; i < this.chainLinks.length - 1; i++) {
                const a = this.chainLinks[i];
                const b = this.chainLinks[i + 1];
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
                ctx.strokeRect(a.x - 1.5, a.y - 1, 3, 2);
            }
        }

        if (this.rustPatches) {
            for (const patch of this.rustPatches) {
                ctx.fillStyle = `rgba(139, 69, 19, ${patch.alpha})`;
                ctx.beginPath();
                ctx.ellipse(patch.x, patch.y, patch.rx, patch.ry, patch.rot, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    drawSandbagBarricade() {
        const hw = this.width / 2;
        const hh = this.height / 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, hh * 0.42, hw * 0.95, hh * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#3a3020';
        ctx.fillRect(-hw * 0.9, hh * 0.3, hw * 1.8, hh * 0.15);
        ctx.strokeStyle = '#2a2010';
        ctx.lineWidth = 1;
        ctx.strokeRect(-hw * 0.9, hh * 0.3, hw * 1.8, hh * 0.15);
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(-hw * 0.8 + i * hw * 0.4, hh * 0.3);
            ctx.lineTo(-hw * 0.75 + i * hw * 0.4, hh * 0.45);
            ctx.stroke();
        }

        if (this.bags) {
            for (const bag of this.bags) {
                ctx.save();
                ctx.translate(bag.x, bag.y);
                ctx.rotate(bag.seamAngle);
                const bagColor = `rgb(${Math.floor(139 * bag.shade)}, ${Math.floor(115 * bag.shade)}, ${Math.floor(85 * bag.shade)})`;
                const bagGrad = ctx.createLinearGradient(-bag.w / 2, -bag.h / 2, bag.w / 2, bag.h / 2);
                bagGrad.addColorStop(0, bagColor);
                bagGrad.addColorStop(0.5, `rgb(${Math.floor(110 * bag.shade)}, ${Math.floor(90 * bag.shade)}, ${Math.floor(65 * bag.shade)})`);
                bagGrad.addColorStop(1, `rgb(${Math.floor(80 * bag.shade)}, ${Math.floor(65 * bag.shade)}, ${Math.floor(45 * bag.shade)})`);
                ctx.fillStyle = bagGrad;
                ctx.beginPath();
                ctx.ellipse(0, 0, bag.w / 2, bag.h / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#4a3a2a';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.strokeStyle = 'rgba(60,50,35,0.6)';
                ctx.beginPath();
                ctx.moveTo(-bag.w * 0.3, 0);
                ctx.lineTo(bag.w * 0.3, 0);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, -bag.h * 0.25);
                ctx.lineTo(0, bag.h * 0.25);
                ctx.stroke();
                ctx.restore();
            }
        }

        ctx.strokeStyle = '#6a6a6a';
        ctx.lineWidth = 1.2;
        const wireY = -hh * 0.35;
        const wireLeft = -hw * 0.75;
        const wireRight = hw * 0.75;
        ctx.beginPath();
        for (let x = wireLeft; x <= wireRight; x += 6) {
            const y = wireY + Math.sin((x - wireLeft) * 0.25) * 4;
            if (x === wireLeft) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        for (let loop = 0; loop < this.barbWireLoops; loop++) {
            const lx = wireLeft + (loop / (this.barbWireLoops - 1)) * (wireRight - wireLeft);
            const ly = wireY + Math.sin((lx - wireLeft) * 0.25) * 4;
            ctx.beginPath();
            ctx.moveTo(lx - 3, ly - 2);
            ctx.lineTo(lx, ly + 3);
            ctx.lineTo(lx + 3, ly - 2);
            ctx.stroke();
        }

        if (this.bulletHoles) {
            for (const hole of this.bulletHoles) {
                ctx.fillStyle = '#1a1a1a';
                ctx.beginPath();
                ctx.arc(hole.x, hole.y, hole.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#3a3a3a';
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.arc(hole.x, hole.y, hole.r + 1.5, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        if (this.bloodSplatters) {
            for (const splat of this.bloodSplatters) {
                ctx.fillStyle = 'rgba(120, 15, 15, 0.65)';
                ctx.beginPath();
                ctx.ellipse(splat.x, splat.y, splat.r, splat.r * 0.6, splat.rot, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(80, 8, 8, 0.4)';
                ctx.beginPath();
                ctx.ellipse(splat.x + 1, splat.y + 1, splat.r * 0.5, splat.r * 0.3, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (this.hasCautionTape) {
            ctx.strokeStyle = 'rgba(255, 235, 59, 0.7)';
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(-hw * 0.6, -hh * 0.5);
            ctx.lineTo(hw * 0.3, hh * 0.1);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.font = 'bold 5px Arial';
            ctx.fillText('CAUTION', -hw * 0.15, -hh * 0.15);
        }
    }

    drawMedicalCrate() {
        const hw = this.width / 2;
        const hh = this.height / 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(hw * 0.15, hh * 0.35, hw * 0.7, hh * 0.25, this.crateAngle, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.rotate(this.crateAngle);

        const woodGrad = ctx.createLinearGradient(-hw, -hh, hw, hh);
        woodGrad.addColorStop(0, '#d8d0c0');
        woodGrad.addColorStop(0.5, this.color);
        woodGrad.addColorStop(1, '#a8a090');
        ctx.fillStyle = woodGrad;
        ctx.fillRect(-hw * 0.75, -hh * 0.55, hw * 1.5, hh * 1.1);
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(-hw * 0.75, -hh * 0.55, hw * 1.5, hh * 1.1);

        ctx.strokeStyle = '#8a8070';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-hw * 0.7, -hh * 0.5, hw * 1.4, hh);
        ctx.beginPath();
        ctx.moveTo(-hw * 0.7, 0);
        ctx.lineTo(hw * 0.7, 0);
        ctx.moveTo(0, -hh * 0.5);
        ctx.lineTo(0, hh * 0.5);
        ctx.stroke();

        if (this.woodCracks) {
            ctx.strokeStyle = 'rgba(60,50,40,0.5)';
            ctx.lineWidth = 0.8;
            for (const crack of this.woodCracks) {
                ctx.beginPath();
                ctx.moveTo(crack.x1, crack.y1);
                ctx.lineTo(crack.x2, crack.y2);
                ctx.stroke();
            }
        }

        const crossSize = hh * 0.28;
        ctx.fillStyle = this.crossDamaged ? 'rgba(180, 30, 30, 0.7)' : '#cc2222';
        ctx.fillRect(-crossSize * 0.15, -crossSize * 0.55, crossSize * 0.3, crossSize * 1.1);
        ctx.fillRect(-crossSize * 0.55, -crossSize * 0.15, crossSize * 1.1, crossSize * 0.3);
        if (this.crossDamaged) {
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-crossSize * 0.3, -crossSize * 0.2);
            ctx.lineTo(crossSize * 0.1, crossSize * 0.3);
            ctx.stroke();
        }

        if (this.bloodStains) {
            for (const stain of this.bloodStains) {
                ctx.save();
                ctx.translate(stain.x, stain.y);
                ctx.rotate(stain.rot);
                ctx.fillStyle = 'rgba(100, 12, 12, 0.55)';
                ctx.beginPath();
                ctx.ellipse(0, 0, stain.rx, stain.ry, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        ctx.restore();

        if (this.lidDetached) {
            ctx.save();
            ctx.translate(hw * 0.35, -hh * 0.15);
            ctx.rotate(this.crateAngle + 0.6);
            ctx.fillStyle = '#b8b0a0';
            ctx.fillRect(-hw * 0.35, -hh * 0.08, hw * 0.7, hh * 0.16);
            ctx.strokeStyle = '#6a6050';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-hw * 0.35, -hh * 0.08, hw * 0.7, hh * 0.16);
            ctx.restore();
        }

        if (this.spilledItems) {
            for (const item of this.spilledItems) {
                ctx.save();
                ctx.translate(item.x, item.y);
                ctx.rotate(item.rot);
                ctx.scale(item.scale, item.scale);
                if (item.type === 'bandage') {
                    ctx.fillStyle = '#f5f0e8';
                    ctx.fillRect(-5, -2, 10, 4);
                    ctx.strokeStyle = '#cc2222';
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(-3, 0);
                    ctx.lineTo(3, 0);
                    ctx.stroke();
                } else if (item.type === 'syringe') {
                    ctx.fillStyle = 'rgba(200,220,240,0.7)';
                    ctx.fillRect(-1, -6, 2, 8);
                    ctx.fillStyle = '#888';
                    ctx.fillRect(-2, 2, 4, 3);
                    ctx.fillStyle = '#cc2222';
                    ctx.fillRect(-0.5, -7, 1, 2);
                } else if (item.type === 'bottle') {
                    ctx.fillStyle = 'rgba(180,210,180,0.6)';
                    ctx.fillRect(-3, -5, 6, 8);
                    ctx.fillStyle = '#4a6a4a';
                    ctx.fillRect(-2, -6, 4, 2);
                } else {
                    ctx.fillStyle = '#f0ece0';
                    ctx.beginPath();
                    ctx.ellipse(0, 0, 5, 3, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#d0ccc0';
                    ctx.stroke();
                }
                ctx.restore();
            }
        }
    }

    drawConcreteBarrier() {
        const hw = this.width / 2;
        const hh = this.height / 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, hh * 0.38, hw * 0.9, hh * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        const barrierGrad = ctx.createLinearGradient(-hw, -hh, hw, hh);
        barrierGrad.addColorStop(0, '#b0b0ac');
        barrierGrad.addColorStop(0.4, this.color);
        barrierGrad.addColorStop(1, '#7a7a76');
        ctx.fillStyle = barrierGrad;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.85, hh * 0.35);
        ctx.lineTo(-hw * 0.65, -hh * 0.45);
        ctx.lineTo(hw * 0.65, -hh * 0.45);
        ctx.lineTo(hw * 0.85, hh * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.moveTo(-hw * 0.6, -hh * 0.35);
        ctx.lineTo(-hw * 0.55, hh * 0.25);
        ctx.lineTo(-hw * 0.45, hh * 0.25);
        ctx.lineTo(-hw * 0.5, -hh * 0.35);
        ctx.closePath();
        ctx.fill();

        if (this.chipDamage) {
            ctx.fillStyle = '#6a6a66';
            for (const chip of this.chipDamage) {
                ctx.fillRect(chip.x, chip.y, chip.w, chip.h);
            }
        }

        if (this.cracks) {
            ctx.strokeStyle = 'rgba(50,50,48,0.7)';
            ctx.lineWidth = 1;
            for (const crack of this.cracks) {
                ctx.beginPath();
                ctx.moveTo(crack.x, crack.y);
                ctx.lineTo(
                    crack.x + Math.cos(crack.angle) * crack.len,
                    crack.y + Math.sin(crack.angle) * crack.len
                );
                ctx.stroke();
                for (let b = 0; b < crack.branches; b++) {
                    const mid = crack.len * (0.4 + b * 0.2);
                    const bx = crack.x + Math.cos(crack.angle) * mid;
                    const by = crack.y + Math.sin(crack.angle) * mid;
                    const bAngle = crack.angle + (b % 2 === 0 ? 0.6 : -0.6);
                    ctx.beginPath();
                    ctx.moveTo(bx, by);
                    ctx.lineTo(bx + Math.cos(bAngle) * crack.len * 0.4, by + Math.sin(bAngle) * crack.len * 0.4);
                    ctx.stroke();
                }
            }
        }

        if (this.rebarPieces) {
            ctx.strokeStyle = '#8a5030';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            for (const bar of this.rebarPieces) {
                ctx.beginPath();
                ctx.moveTo(bar.x, bar.y);
                if (bar.bent) {
                    ctx.lineTo(bar.x + Math.cos(bar.angle) * bar.len * 0.6, bar.y + Math.sin(bar.angle) * bar.len * 0.6);
                    ctx.lineTo(bar.x + Math.cos(bar.angle + 0.8) * bar.len, bar.y + Math.sin(bar.angle + 0.8) * bar.len);
                } else {
                    ctx.lineTo(bar.x + Math.cos(bar.angle) * bar.len, bar.y + Math.sin(bar.angle) * bar.len);
                }
                ctx.stroke();
            }
        }

        ctx.save();
        ctx.font = `bold ${Math.floor(hh * 0.45)}px Arial`;
        ctx.fillStyle = this.graffitiColor;
        ctx.globalAlpha = 0.75;
        ctx.translate(-hw * 0.1, hh * 0.05);
        ctx.rotate(-0.15);
        ctx.fillText(this.graffitiText, 0, 0);
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#000';
        ctx.fillText(this.graffitiText, 1.5, 1.5);
        ctx.restore();

        if (this.handprint) {
            ctx.save();
            ctx.translate(this.handprint.x, this.handprint.y);
            ctx.rotate(this.handprint.rot);
            ctx.scale(this.handprint.scale, this.handprint.scale);
            ctx.fillStyle = 'rgba(100, 12, 12, 0.5)';
            ctx.beginPath();
            ctx.ellipse(0, 0, 6, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            for (let f = 0; f < 4; f++) {
                ctx.beginPath();
                ctx.ellipse(-4 + f * 2.5, -9, 1.5, 4, -0.2 + f * 0.1, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.beginPath();
            ctx.ellipse(5, -4, 2, 3, 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    drawAmmoCrate() {
        const hw = this.width / 2;
        const hh = this.height / 2;

        if (this.casings) {
            for (const casing of this.casings) {
                ctx.save();
                ctx.translate(casing.x, casing.y);
                ctx.rotate(casing.rot);
                const brass = casing.brass;
                ctx.fillStyle = brass ? '#c9a227' : '#8a8a7a';
                ctx.fillRect(-casing.len / 2, -1.2, casing.len, 2.4);
                ctx.fillStyle = brass ? '#a08018' : '#6a6a5a';
                ctx.beginPath();
                ctx.ellipse(casing.len / 2, 0, 1, 1.2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#3a3a30';
                ctx.beginPath();
                ctx.ellipse(-casing.len / 2, 0, 0.8, 1, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, hh * 0.42, hw * 0.75, hh * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        const crateGrad = ctx.createLinearGradient(-hw, -hh, hw, hh);
        crateGrad.addColorStop(0, '#4a5a32');
        crateGrad.addColorStop(0.5, this.color);
        crateGrad.addColorStop(1, '#2a3018');
        ctx.fillStyle = crateGrad;
        ctx.fillRect(-hw * 0.7, -hh * 0.45, hw * 1.4, hh * 0.9);
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(-hw * 0.7, -hh * 0.45, hw * 1.4, hh * 0.9);

        ctx.strokeStyle = '#2a3818';
        ctx.lineWidth = 2;
        ctx.strokeRect(-hw * 0.65, -hh * 0.4, hw * 1.3, hh * 0.8);
        ctx.beginPath();
        ctx.moveTo(-hw * 0.65, 0);
        ctx.lineTo(hw * 0.65, 0);
        ctx.stroke();

        ctx.save();
        ctx.globalAlpha = this.stencilWorn;
        ctx.fillStyle = '#c8c8b0';
        ctx.font = `bold ${Math.floor(hh * 0.22)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('AMMO', 0, hh * 0.08);
        ctx.font = `${Math.floor(hh * 0.14)}px Arial`;
        ctx.fillText('7.62', 0, hh * 0.28);
        ctx.restore();

        if (this.lidOpen) {
            ctx.save();
            ctx.translate(-hw * 0.35, -hh * 0.45);
            ctx.rotate(-this.lidAngle);
            ctx.fillStyle = '#354020';
            ctx.fillRect(0, 0, hw * 0.75, hh * 0.12);
            ctx.strokeStyle = '#1a2010';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(0, 0, hw * 0.75, hh * 0.12);
            ctx.fillStyle = '#2a3018';
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(hw * 0.1 + i * hw * 0.15, hh * 0.02, 2, hh * 0.08);
            }
            ctx.restore();
        }

        if (this.beltSegments) {
            ctx.strokeStyle = '#4a5a30';
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 0; i < this.beltSegments.length; i++) {
                const seg = this.beltSegments[i];
                ctx.save();
                ctx.translate(seg.x, seg.y);
                ctx.rotate(seg.rot);
                ctx.fillStyle = '#3d4a2a';
                ctx.fillRect(-3, -2, 6, 5);
                ctx.fillStyle = '#c9a227';
                ctx.beginPath();
                ctx.ellipse(0, 0, 2, 2.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        if (this.woodSplinters) {
            ctx.fillStyle = '#5a4a30';
            for (const splinter of this.woodSplinters) {
                ctx.save();
                ctx.translate(splinter.x, splinter.y);
                ctx.rotate(splinter.angle);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(splinter.len, -1);
                ctx.lineTo(splinter.len * 0.9, 1);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }

        ctx.fillStyle = '#2a2818';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.ellipse(-hw * 0.3 + i * 4, -hh * 0.35, 2.5, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

