/**
 * Ambient main-menu metal gunshot impacts — spark flash every 3s, 1s lifetime.
 */

const SPAWN_INTERVAL_MS = 3000;
const SHOT_DURATION_MS = 1000;
const FIRST_SPAWN_DELAY_MS = 1200;

export class MenuMetalGunshotEffect {
    constructor(getCanvas) {
        this.getCanvas = getCanvas;
        this.shots = [];
        this.menuEnteredAt = Date.now();
        this.nextSpawnAt = this.menuEnteredAt + FIRST_SPAWN_DELAY_MS;
    }

    reset() {
        this.shots = [];
        this.menuEnteredAt = Date.now();
        this.nextSpawnAt = this.menuEnteredAt + FIRST_SPAWN_DELAY_MS;
    }

    update() {
        const canvas = this.getCanvas();
        const width = canvas.width;
        const height = canvas.height;
        const now = Date.now();

        if (now >= this.nextSpawnAt) {
            this._spawnShot(width, height);
            this.nextSpawnAt = now + SPAWN_INTERVAL_MS;
        }

        for (let i = this.shots.length - 1; i >= 0; i--) {
            if (now - this.shots[i].startTime >= SHOT_DURATION_MS) {
                this.shots.splice(i, 1);
            }
        }
    }

    _spawnShot(width, height) {
        let x = 0;
        let y = 0;
        let valid = false;

        for (let attempt = 0; attempt < 12; attempt++) {
            x = width * 0.08 + Math.random() * width * 0.84;
            y = height * 0.08 + Math.random() * height * 0.84;
            const minDim = Math.min(width, height);
            if (Math.hypot(x - width * 0.5, y - height * 0.5) > minDim * 0.22) {
                valid = true;
                break;
            }
        }
        if (!valid) return;

        const impactAngle = Math.random() * Math.PI * 2;
        const sparks = [];
        for (let i = 0; i < 14; i++) {
            sparks.push({
                angle: impactAngle + (Math.random() - 0.5) * 2.2,
                length: 6 + Math.random() * 24,
                width: 0.6 + Math.random() * 1.8,
                hot: Math.random() > 0.45
            });
        }

        const ricochets = [];
        for (let i = 0; i < 4; i++) {
            ricochets.push({
                angle: impactAngle + Math.PI + (Math.random() - 0.5) * 0.9,
                length: 16 + Math.random() * 42,
                width: 1 + Math.random() * 1.2
            });
        }

        this.shots.push({
            x,
            y,
            startTime: Date.now(),
            impactAngle,
            sparks,
            ricochets,
            chipAngle: impactAngle + (Math.random() - 0.5) * 0.4
        });
    }

    draw(ctx) {
        const now = Date.now();

        for (let s = 0; s < this.shots.length; s++) {
            const shot = this.shots[s];
            const elapsed = now - shot.startTime;
            const t = Math.min(1, elapsed / SHOT_DURATION_MS);
            const flashT = Math.min(1, elapsed / 90);
            const sparkT = Math.min(1, elapsed / 280);
            const fade = 1 - t;

            ctx.save();
            ctx.translate(shot.x, shot.y);
            ctx.rotate(shot.chipAngle);

            // Brushed metal scratch under impact
            ctx.globalAlpha = fade * 0.18;
            ctx.strokeStyle = '#6a7a8a';
            ctx.lineWidth = 1;
            for (let i = -2; i <= 2; i++) {
                ctx.beginPath();
                ctx.moveTo(-28, i * 5);
                ctx.lineTo(28, i * 5);
                ctx.stroke();
            }

            // Impact dent / scorch
            ctx.globalAlpha = fade * 0.55;
            const dentGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 16);
            dentGrad.addColorStop(0, 'rgba(12, 14, 18, 0.95)');
            dentGrad.addColorStop(0.45, 'rgba(40, 48, 58, 0.7)');
            dentGrad.addColorStop(1, 'rgba(80, 96, 112, 0)');
            ctx.fillStyle = dentGrad;
            ctx.beginPath();
            ctx.ellipse(0, 0, 11, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.rotate(-shot.chipAngle);

            // Shock ring on metal
            const ringRadius = 6 + t * 34;
            ctx.globalAlpha = fade * 0.45 * (1 - t);
            ctx.strokeStyle = 'rgba(200, 220, 255, 0.85)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Ricochet streaks skimming off metal
            for (let i = 0; i < shot.ricochets.length; i++) {
                const streak = shot.ricochets[i];
                const streakFade = Math.max(0, 1 - sparkT * 1.4);
                if (streakFade <= 0) continue;

                ctx.globalAlpha = streakFade * 0.75;
                ctx.strokeStyle = streak.width > 1.6 ? '#fff8e8' : '#c8dcf5';
                ctx.lineWidth = streak.width;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(
                    Math.cos(streak.angle) * streak.length,
                    Math.sin(streak.angle) * streak.length
                );
                ctx.stroke();
            }

            // Metal spark burst — batched by type to minimize shadowBlur state changes
            ctx.lineCap = 'round';
            // Hot sparks first
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(255, 160, 60, 0.9)';
            ctx.strokeStyle = '#ffd080';
            for (let i = 0; i < shot.sparks.length; i++) {
                const spark = shot.sparks[i];
                if (!spark.hot) continue;
                const sparkFade = Math.max(0, 1 - sparkT * 1.1);
                if (sparkFade <= 0) continue;
                ctx.globalAlpha = sparkFade;
                ctx.lineWidth = spark.width;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(
                    Math.cos(spark.angle) * spark.length,
                    Math.sin(spark.angle) * spark.length
                );
                ctx.stroke();
            }
            // Cold sparks
            ctx.shadowBlur = 5;
            ctx.shadowColor = 'rgba(180, 220, 255, 0.8)';
            ctx.strokeStyle = '#e8f4ff';
            for (let i = 0; i < shot.sparks.length; i++) {
                const spark = shot.sparks[i];
                if (spark.hot) continue;
                const sparkFade = Math.max(0, 1 - sparkT * 1.35);
                if (sparkFade <= 0) continue;
                ctx.globalAlpha = sparkFade * 0.85;
                ctx.lineWidth = spark.width;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(
                    Math.cos(spark.angle) * spark.length,
                    Math.sin(spark.angle) * spark.length
                );
                ctx.stroke();
            }
            ctx.shadowBlur = 0;

            // Core white-hot flash
            if (flashT < 1) {
                const flashAlpha = 1 - flashT;
                const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 14 + flashT * 10);
                coreGrad.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
                coreGrad.addColorStop(0.35, `rgba(200, 230, 255, ${flashAlpha * 0.7})`);
                coreGrad.addColorStop(1, 'rgba(255, 180, 80, 0)');
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;
                ctx.fillStyle = coreGrad;
                ctx.beginPath();
                ctx.arc(0, 0, 14 + flashT * 10, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }
}
