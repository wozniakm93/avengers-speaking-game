import { Entity } from './Entity.js';
import { ImageUtils } from '../utils/ImageUtils.js';

export class Player extends Entity {
    constructor(game, x, y, heroType = 'captain') {
        super(game, x, y);
        this.heroType = heroType;

        // Stats
        if (this.heroType === 'captain') {
            this.attackStat = 3;
            this.hp = 3;
            this.moneyMultiplier = 0.5; // User 1x
        } else if (this.heroType === 'spiderman') {
            this.attackStat = 4;
            this.hp = 3;
            this.moneyMultiplier = 1.0; // User 2x
        } else if (this.heroType === 'ironman') {
            this.attackStat = 4;
            this.hp = 2;
            this.moneyMultiplier = 3.0; // User 6x
        } else if (this.heroType === 'cyclops') {
            this.attackStat = 5;
            this.hp = 2;
            this.moneyMultiplier = 2.0;     // User 2x
        } else if (this.heroType === 'darkphoenix') {
            this.attackStat = 8;
            this.hp = 5;
            this.moneyMultiplier = 1.5; // User 3x
        } else if (this.heroType === 'thor') {
            this.attackStat = 7;
            this.hp = 4;
            this.moneyMultiplier = 2.0; // User 4x
        } else if (this.heroType === 'IronManHulkBuster') {
            this.attackStat = 8;
            this.hp = 4;
            this.moneyMultiplier = 2.0; // 4x input from user (Multiplier/2 logic means 2.0)
            // Actually user said MoneyMultiplier: 4. The game logic divides by 2 later.
            // Wait, previous logic: "multiplierFactor = this.player.moneyMultiplier / 2".
            // If user wants 4x result, I should set it to 8?
            // "jesli ktos ma moneyMultipler 4x to tak naprawdę powinnismy dreopniętge monety/kryształy mnożyc x2"
            // So if I set it to 4, factor is 2. Correct.
            this.moneyMultiplier = 4.0;
        } else if (this.heroType === 'capitandamaged') {
            this.attackStat = 6;
            this.hp = 2;
            this.moneyMultiplier = 2.0;
        }

        this.maxHp = this.hp;
        this.maxHp = this.hp;

        if (this.heroType === 'IronManHulkBuster') {
            this.width = 150;
            this.height = 130;
        } else {
            this.width = 100;
            this.height = 100;
        }

        // Asset placeholders
        this.image = new Image();

        // Load Sprite (Standard)
        this.image = new Image();
        this.image.src = `assets/spr_${heroType}.png`;

        this.bobOffset = 0;
    }

    update(deltaTime) {
        super.update(deltaTime);
        // Simple Bobbing Animation
        this.bobOffset += deltaTime * 5;
    }

    draw(ctx) {
        // Draw Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height - 5, 30, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw Sprite
        if (this.image.complete && this.image.naturalWidth > 0) {
            const bobY = Math.sin(this.bobOffset) * 5;
            ctx.drawImage(this.image, this.x, this.y + bobY, this.width, this.height);
        } else {
            ctx.fillStyle = this.heroType === 'captain' ? 'blue' : 'red';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        // Draw HP bar REMOVED (Moved to HUD)

        // Draw Name
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.heroType.toUpperCase(), this.x + this.width / 2, this.y - 25);
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) this.hp = 0;
    }
}
