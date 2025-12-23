import { Entity } from './Entity.js';

export class Projectile extends Entity {
    constructor(game, x, y, type, targetX, targetY) {
        super(game, x, y);
        this.type = type; // 'shield', 'laser', 'web'
        this.targetX = targetX;
        this.targetY = targetY;

        this.active = true;
        this.returning = false; // For shield

        this.angle = 0;

        if (type === 'shield' || type === 'hammer') {
            this.speed = 280; // Was 400
            this.width = 30;
            this.height = 30;
            this.image = new Image(); // TODO: Load shield sprite or draw
        } else if (type === 'web') {
            this.speed = 315; // Was 450
            this.width = 20;
            this.height = 20;
        } else if (type === 'repulsor') {
            this.speed = 350; // Was 500
            this.width = 40;
            this.height = 10;
        } else if (type === 'optic') {
            this.speed = 420; // Was 600
            this.width = 50; // CORRECT WIDTH (Was 800 causing offset issue)
            this.height = 10;
            this.color = '#ef4444'; // Keep original color for optic
        } else if (type === 'phoenix') {
            this.speed = 315; // Was 450
            this.width = 60; // Bigger hitbox
            this.height = 40;
        } else if (type === 'lightning') {
            this.speed = 560;
            this.width = 100; // Much bigger (was 40)
            this.height = 40; // thick
        } else if (type === 'laser') { // Added back laser type with new speed
            this.speed = 350; // Was 500
            this.width = 30; // Default width
            this.width = 30; // Default width
            this.height = 30; // Default height
            this.color = '#ef4444';
        } else if (type === 'buster_laser') {
            this.speed = 600; // Very fast
            this.width = 100; // Long (drawn as beam though)
            this.height = 60; // Thick
        } else { // Default for any other type not explicitly handled
            this.speed = 280; // Default speed (0.7 * 400)
            this.width = 30;
            this.height = 30;
        }

        // Calculate velocity
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;

        this.startX = x;
        this.startY = y;

        // Beam Properties (Buster Laser)
        if (this.type === 'buster_laser') {
            this.isBeam = true;
            this.beamLength = 0;
            this.maxBeamLength = 1800; // 1.5x longer (was 1200)
            this.lifeTime = 1.0; // Duration
            this.hitEnemies = []; // IDs of hit enemies
            this.vx = 0; // Stationary
            this.vy = 0;
            // Angle? Should calculate angle once
            this.angle = Math.atan2(targetY - y, targetX - x);
        }
    }

    update(deltaTime) {
        if (!this.active) return;

        // Rotate shield OR Hammer
        if (this.type === 'shield' || this.type === 'hammer') {
            this.angle += deltaTime * 20;

            // Check turn around logic
            if (!this.returning) {
                const distToStart = Math.abs(this.x - this.startX);
                const distToTarget = Math.abs(this.x - this.targetX);

                if (distToTarget < 20) {
                    this.returning = true;
                    this.vx *= -1;
                    this.vy *= -1;
                }
            } else {
                const distToStart = Math.abs(this.x - this.startX);
                if (distToStart < 20) {
                    this.active = false;
                }
            }
        }

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Timeout for laser
        if (this.type === 'laser') {
            if (Math.abs(this.x - this.startX) > 1000) this.active = false;
        }

        // Beam Update
        if (this.isBeam) {
            // Grow
            if (this.beamLength < this.maxBeamLength) {
                this.beamLength += deltaTime * 4000; // Fast expansion
                if (this.beamLength > this.maxBeamLength) this.beamLength = this.maxBeamLength;
            }
            // Decay
            this.lifeTime -= deltaTime;
            if (this.lifeTime <= 0) {
                this.active = false;
            }
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        if (this.type === 'shield') {
            ctx.rotate(this.angle);
            // Draw Shield
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.fillStyle = '#ef4444'; // Red
            ctx.fill();
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff'; // White
            ctx.fill();
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#3b82f6'; // Blue
            ctx.fill();
        } else if (this.type === 'hammer') {
            ctx.rotate(this.angle); // Spin

            // Handle
            ctx.fillStyle = '#78350f'; // Brown
            ctx.fillRect(-5, 0, 10, 25);

            // Head
            ctx.fillStyle = '#9ca3af'; // Grey/Silver
            ctx.fillRect(-15, -15, 30, 20);

            // Outline
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 2;
            ctx.strokeRect(-15, -15, 30, 20);
        } else if (this.type === 'laser') {
            // Draw Laser
            ctx.rotate(Math.atan2(this.vy, this.vx));
            ctx.fillStyle = 'red';
            ctx.fillRect(-20, -5, 40, 10);
        } else if (this.type === 'web') {
            // Draw Web Ball
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fillStyle = '#f3f4f6'; // White-ish
            ctx.fill();

            // Web detail lines
            ctx.beginPath();
            ctx.strokeStyle = '#9ca3af'; // Gray
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                ctx.rotate(Math.PI / 4);
                ctx.moveTo(-12, 0);
                ctx.lineTo(12, 0);
            }
            ctx.stroke();
        } else if (this.type === 'repulsor') {
            // Light Blue Beam
            ctx.rotate(Math.atan2(this.vy, this.vx));
            ctx.fillStyle = '#38bdf8'; // Cyan-400
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#0ea5e9';
            ctx.fillRect(-20, -8, 40, 16);
            ctx.fillStyle = 'white';
            ctx.fillRect(-15, -4, 30, 8); // Core
            ctx.shadowBlur = 0;
        } else if (this.type === 'optic') {
            // Cyclops Shot (Red Beam)
            ctx.rotate(Math.atan2(this.vy, this.vx));
            ctx.fillStyle = '#ef4444'; // Red-500
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#dc2626';
            ctx.fillRect(-25, -6, 50, 12);
            ctx.fillStyle = '#fca5a5'; // Red-300 core
            ctx.fillRect(-25, -2, 50, 4);
            ctx.shadowBlur = 0;
        } else if (this.type === 'phoenix') {
            // Phoenix Bird Shape
            ctx.rotate(Math.atan2(this.vy, this.vx));

            // Fire Glow
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#f59e0b'; // Amber

            // Gradient
            const grad = ctx.createLinearGradient(-30, 0, 30, 0);
            grad.addColorStop(0, '#fef3c7'); // Yellow (Head)
            grad.addColorStop(0.5, '#f59e0b'); // Orange (Body)
            grad.addColorStop(1, '#ef4444'); // Red (Tail)
            ctx.fillStyle = grad;

            ctx.beginPath();
            // Bird Silhouette (simplified)
            // Head
            ctx.moveTo(30, 0);
            // Top Wing
            ctx.quadraticCurveTo(0, -30, -20, -10);
            // Tail
            ctx.lineTo(-40, 0);
            // Bottom Wing
            ctx.lineTo(-20, 10);
            ctx.quadraticCurveTo(0, 30, 30, 0);
            ctx.fill();

            ctx.shadowBlur = 0;
        } else if (this.type === 'lightning') {
            ctx.rotate(this.angle);

            // Jitter for "Sparkling" effect
            const jitter = () => (Math.random() - 0.5) * 10;

            // Main Bolt (Larger)
            ctx.beginPath();
            ctx.moveTo(-50, 0);
            ctx.lineTo(-25 + jitter(), -15 + jitter());
            ctx.lineTo(0 + jitter(), 0 + jitter());
            ctx.lineTo(25 + jitter(), -15 + jitter());
            ctx.lineTo(50, 0);

            ctx.lineWidth = 6;
            ctx.strokeStyle = '#fef08a'; // Lighter Core
            ctx.shadowColor = '#eab308'; // Darker Glow
            ctx.shadowBlur = 20;
            ctx.stroke();

            // Extra Sparks/Branches
            ctx.beginPath();
            ctx.lineWidth = 2;
            // Branch 1
            ctx.moveTo(0, 0);
            ctx.lineTo(10 + jitter(), 20 + jitter());
            // Branch 2
            ctx.moveTo(-20, -5);
            ctx.lineTo(-10 + jitter(), -25 + jitter());
            ctx.stroke();

            ctx.shadowBlur = 0; // Reset
            ctx.lineWidth = 2;
        } else if (this.type === 'spear') {
            // Rotate based on velocity to point in direction of travel
            ctx.rotate(Math.atan2(this.vy, this.vx));

            // Shaft
            ctx.beginPath();
            ctx.moveTo(-20, 0);
            ctx.lineTo(15, 0);
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#854d0e'; // Brown wood
            ctx.stroke();

            // Tip
            ctx.beginPath();
            ctx.moveTo(15, -4);
            ctx.lineTo(25, 0);
            ctx.lineTo(15, 4);
            ctx.closePath();
            ctx.fillStyle = '#94a3b8'; // Stone/Iron tip
            ctx.fill();
        } else if (this.type === 'rock') {
            // Rock spins?
            ctx.rotate(this.angle + (Date.now() / 100)); // Spin based on time

            ctx.beginPath();
            // Rough circle
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.fillStyle = '#57534e'; // Stone gray
            ctx.fill();

            // Texture dots
            ctx.fillStyle = '#292524';
            ctx.beginPath(); ctx.arc(-5, -5, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(4, 4, 2, 0, Math.PI * 2); ctx.fill();
        } else if (this.type === 'buster_laser') {
            ctx.rotate(Math.atan2(this.vy, this.vx));

            // Draw Beam with dynamic length
            const length = this.beamLength;

            // Outer Glow (Red-600)
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#dc2626';

            // Main Beam Body (Red-500) - 3x Thicker (36px total height)
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(0, -18, length, 36);

            // Core Energy (White) - (12px total height)
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#fef08a';
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, -6, length, 12);

            // Front "Flare" at emitter (0,0) - Larger
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, Math.PI * 2);
            ctx.fillStyle = '#fee2e2';
            ctx.fill();

            // Tip "Flare"
            ctx.beginPath();
            ctx.arc(length, 0, 20, 0, Math.PI * 2);
            ctx.fillStyle = '#fca5a5';
            ctx.fill();

            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }
}
