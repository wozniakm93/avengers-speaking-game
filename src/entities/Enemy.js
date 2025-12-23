import { Entity } from './Entity.js';
import { WORDS } from '../data/Words.js';
import { ImageUtils } from '../utils/ImageUtils.js';

export class Enemy extends Entity {
    constructor(game, x, y, options = {}) {
        super(game, x, y);
        this.biome = options.biome || 'city';
        this.isBoss = options.isBoss || false;

        this.width = 100;
        this.height = 100;

        this.level = options.level || 1;
        this.tint = options.tint || null;
        this.tintedImage = null;

        let section = 1;
        if (this.biome === 'jungle') section = 2;
        if (this.biome === 'lab') section = 3;

        // Define Enemy Type based on biome/section
        this.enemyType = 'robot';
        let spriteName = 'spr_robot';

        if (section === 2) {
            this.enemyType = 'lizard';
            spriteName = 'spr_lizard';
        } else if (section === 3) {
            this.enemyType = 'gorilla';
            spriteName = 'spr_robomonkey';
        }

        if (this.isBoss) {
            // Boss HP Formula
            this.hp = 24 + section;
            // Bosses are bigger
            this.width = 250;
            this.height = 250;
        } else {
            // Random HP (4 to 12)
            this.hp = Math.floor(Math.random() * 9) + 4;
            // Regular size adjustments if needed
            if (this.enemyType === 'gorilla') {
                this.width = 140; // Gorillas are bulky
                this.height = 140;
            } else if (this.enemyType === 'lizard') {
                this.width = 110;
                this.height = 110;
            }
        }

        this.maxHp = this.hp;

        // Image
        this.image = new Image();
        const src = `/src/assets/${spriteName}.png`;
        ImageUtils.makeTransparent(src).then(img => this.image = img);

        this.word = this.getRandomWord();
        this.bobOffset = Math.random() * 10;

        this.flashTimer = 0;
        this.isFlashing = false;
        this.opacity = 1;
    }

    getRandomWord() {
        let listKey = 1;
        if (this.level >= 8 && this.level <= 14) listKey = 2;
        if (this.level >= 15) listKey = 3;

        const list = WORDS[listKey] || WORDS[1];
        return list[Math.floor(Math.random() * list.length)];
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.bobOffset += deltaTime * 3;

        // Damage Flash Logic
        if (this.isFlashing) {
            this.flashTimer += deltaTime;
            // Flicker every 0.1s (5 times total = 0.5s approx, user asked for 5-fold fading)
            // Let's make it flicker rapidly
            if (Math.floor(this.flashTimer * 15) % 2 === 0) {
                this.opacity = 1;
            } else {
                this.opacity = 0.3;
            }

            if (this.flashTimer > 0.75) {
                this.isFlashing = false;
                this.opacity = 1;
                // If HP is 0, now we die
                if (this.hp <= 0) {
                    this.state = 'dead';
                }
            }
        } else {
            // Instant death check just in case
            if (this.hp <= 0) {
                this.state = 'dead';
            }
        }
    }

    flash() {
        this.isFlashing = true;
        this.flashTimer = 0;
    }

    // Deprecated but keeping signature compatible if called
    startDying() {
        this.flash();
    }

    draw(ctx) {
        if (this.state === 'dead' && !this.isDying) return; // Don't draw if fully dead

        ctx.save();
        ctx.globalAlpha = this.opacity;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height - 5, this.width / 3, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.image.complete && this.image.naturalWidth > 0) {
            const bobY = Math.sin(this.bobOffset) * 5;

            // Prepare Tinted Image
            if (this.tint && !this.tintedImage) {
                const off = document.createElement('canvas');
                off.width = this.image.width;
                off.height = this.image.height;
                const oCtx = off.getContext('2d');
                oCtx.drawImage(this.image, 0, 0);
                oCtx.globalCompositeOperation = 'source-atop';
                oCtx.fillStyle = this.tint;
                oCtx.fillRect(0, 0, off.width, off.height);
                this.tintedImage = off;
            }

            // Draw Sprite
            const imgToDraw = this.tintedImage || this.image;
            ctx.drawImage(imgToDraw, this.x, this.y + bobY, this.width, this.height);
        } else {
            ctx.fillStyle = 'grey';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        ctx.restore();

        // Hearts (HP) - Draw AFTER restore to ensure 100% Opacity
        if (!this.isDying) {
            const heartSize = 16;
            // Calculate total width based on MAX HP to keep position fixed
            // Assuming approx 20px per heart character with some spacing
            const totalWidth = this.maxHp * 18; // 18px per heart estimation
            const startX = (this.x + this.width / 2) - (totalWidth / 2);

            const hearts = '❤️'.repeat(Math.max(0, this.hp));

            ctx.save();
            ctx.font = '16px Arial';
            ctx.textAlign = 'left'; // Align left so it shrinks from right
            ctx.textBaseline = 'bottom';
            // Draw hearts starting from calculation
            ctx.fillText(hearts, startX, this.y - 10);
            ctx.restore();
        }
    }
}
