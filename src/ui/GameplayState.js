import { State } from '../engine/State.js';
import { SpeechManager } from '../audio/SpeechManager.js';
import { AudioManager } from '../audio/AudioManager.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Projectile } from '../entities/Projectile.js';
import { RESOURCES } from '../engine/ResourceManager.js';
import { HOMOPHONES } from '../data/Homophones.js';

export class GameplayState extends State {
    constructor(levelInfo) {
        super();
        this.levelInfo = levelInfo;
        this.levelInfo = levelInfo;
        this.speechManager = new SpeechManager();
        this.audioManager = new AudioManager();
        this.cameraX = 0;

        this.player = null;
        this.enemies = [];
        this.bgImage = new Image();
        this.bgImage.src = `/src/assets/bg_${this.levelInfo.biome}.png`;

        this.gameState = 'EXPLORE'; // EXPLORE, COMBAT_WAIT, COMBAT_ACTION
        this.currentEnemy = null;
        this.combatMessage = "";
        this.combatFeedback = "";
        this.interimSpeech = "";

        this.projectiles = [];
        this.loot = []; // Loot particles
        this.levelGold = 0;
        this.screenShake = 0;

        // Camera System
        // User requested Base Zoom "2x closer" was too close (2.5). oddalamy.
        // Let's try 1.75 (Middle ground between 1.25 and 2.5)
        this.currentZoom = 1.75;
        this.targetZoom = 1.75;
        this.cameraFocusX = 0; // Offset from player
        this.cinematicPhase = 'NONE';
        this.cinematicPhase = 'NONE';
        this.cinematicTimer = 0;
        this.victoryTimer = 0;
    }

    enter(game) {
        super.enter(game);
        console.log(`Entering Level ${this.levelInfo.level}`);

        // Consume Rental Ticket changed:
        // Now only consumed on DEATH (Game Over).
        // const heroToPlay = RESOURCES.selectedHero;
        // RESOURCES.consumeRental(heroToPlay); // MOVED TO DEATH
        const heroToPlay = RESOURCES.selectedHero;
        this.player = new Player(game, 100, 400, heroToPlay);

        this.generateEnemies();

        this.createHUD();
    }

    generateEnemies() {
        let startX = 800;
        const count = this.levelInfo.enemyCount;

        for (let i = 0; i < count; i++) {
            const isLast = (i === count - 1);
            const isBoss = isLast && this.levelInfo.isBoss;

            const tints = [
                null, // 1: White (Default)
                'rgba(59, 130, 246, 0.4)', // 2: Blue
                'rgba(239, 68, 68, 0.4)', // 3: Red
                'rgba(34, 197, 94, 0.4)', // 4: Green
                'rgba(249, 115, 22, 0.4)', // 5: Orange
                'rgba(209, 213, 219, 0.5)', // 6: Silver
                'rgba(234, 179, 8, 0.4)' // 7: Gold
            ];
            const levelIdx = (this.levelInfo.level - 1) % 7;

            const options = {
                biome: this.levelInfo.biome,
                isBoss: isBoss,
                level: this.levelInfo.level,
                tint: tints[levelIdx]
            };

            // Increased distance between enemies
            // Gap corresponding to 2-4 seconds travel at 200px/s
            // 2s * 200 = 400px, 4s * 200 = 800px
            const gap = isBoss ? 800 : (Math.floor(Math.random() * 401) + 400);

            // CORRECT LOGIC: Accumulate position
            startX += gap;
            const x = startX;

            const enemy = new Enemy(this.game, x, 400, options);
            this.enemies.push(enemy);
            // startX is already updated
        }
    }

    handleClick(e) {
        // Resume Audio
        this.audioManager.resume();

        if (this.gameState === 'SUCCESS') {
            // Leave Success Screen
            this.exitLevel();
            return;
        }

        if (this.gameState === 'COMBAT_WAIT' && !this.speechManager.isListening) {
            this.startListening();
        }
    }

    createHUD() {
        const ui = document.getElementById('ui-layer');
        ui.innerHTML = '';

        const hud = document.createElement('div');
        hud.style.position = 'absolute';
        hud.style.top = '10px';
        hud.style.left = '10px';
        hud.style.color = 'white';
        hud.style.textShadow = '0 2px 4px black';
        hud.style.color = 'white';
        hud.style.textShadow = '0 2px 4px black';
        hud.innerHTML = `<div style="display:flex; gap:20px;">
            <h2 style="margin:0">POZIOM ${this.levelInfo.level}</h2>
            <h2 style="margin:0; color:#facc15">💎 <span id="ui-gold">0</span></h2>
        </div>
        <div id="ui-hearts" style="font-size: 2rem;"></div>
        <div id="ui-attack" style="font-size: 1.5rem;"></div>`;
        ui.appendChild(hud);

        // Menu Button
        const btnMenu = document.createElement('button');
        btnMenu.innerText = "MENU";
        btnMenu.style.position = 'absolute';
        btnMenu.style.top = '10px';
        btnMenu.style.right = '10px';
        btnMenu.style.padding = '8px 16px';
        btnMenu.style.background = '#ef4444';
        btnMenu.style.color = 'white';
        btnMenu.style.border = 'none';
        btnMenu.style.borderRadius = '5px';
        btnMenu.style.cursor = 'pointer';
        btnMenu.style.fontWeight = 'bold';
        btnMenu.className = 'interactive';
        btnMenu.onclick = () => {
            this.speechManager.stop();
            // Consume rental if quitting mid-level (Count as defeat/usage)
            if (this.player && this.player.heroType) {
                RESOURCES.consumeRental(this.player.heroType);
            }
            import('./MenuState.js').then(m => {
                this.game.setState(new m.MenuState());
            });
        };
        ui.appendChild(btnMenu);
    }

    exit() {
        const ui = document.getElementById('ui-layer');
        ui.innerHTML = '';
        this.speechManager.stop();
        super.exit();
    }

    update(deltaTime) {
        if (document.getElementById('ui-gold')) {
            document.getElementById('ui-gold').innerText = this.levelGold;
        }

        if (this.player && document.getElementById('ui-hearts')) {
            let hearts = "";
            for (let i = 0; i < this.player.hp; i++) hearts += "❤️";
            document.getElementById('ui-hearts').innerText = hearts;

            let swords = "";
            for (let i = 0; i < this.player.attackStat; i++) swords += "⚔️";
            document.getElementById('ui-attack').innerText = swords;
        }

        if (!this.player) return;

        if (this.player.hp <= 0) {
            return;
        }

        // Update Projectiles
        this.projectiles.forEach(p => p.update(deltaTime));
        this.projectiles = this.projectiles.filter(p => p.active);

        // Update Enemies (Critical for death animation)
        this.enemies.forEach(e => e.update(deltaTime));

        // Check Projectile Collisions
        this.projectiles.forEach(p => {
            if (!p.active) return;

            // Player Projectile vs Enemy
            if ((p.type === 'shield' || p.type === 'hammer' || p.type === 'web' || p.type === 'repulsor' || p.type === 'optic' || p.type === 'phoenix' || p.type === 'lightning' || p.type === 'buster_laser') && this.currentEnemy) {

                // BEAM COLLISION (Hitbox)
                if (p.isBeam) {
                    // Check if Enemy is within Beam Length
                    if (!p.hitEnemies.includes(this.currentEnemy.id)) {
                        // Horizontal Range
                        const enemyLeft = this.currentEnemy.x;
                        const enemyRight = this.currentEnemy.x + this.currentEnemy.width;
                        const beamStart = p.startX;
                        const beamEnd = p.startX + p.beamLength;

                        // Vertical Range (Beam is 3x thicker: +- 18, so 36 height)
                        const beamTop = p.startY - 18;
                        const beamBottom = p.startY + 18;
                        const enemyTop = this.currentEnemy.y;
                        const enemyBottom = this.currentEnemy.y + this.currentEnemy.height;

                        // Check Overlap
                        // Simply: Does beam X range intersect Enemy X range?
                        // And beam Y range intersect Enemy Y range?
                        // Since beam goes to infinity (maxBeamLength), usually just checking start < enemyRight is enough if we assume it hits everything to the right.
                        // But let's be proper.

                        const overlapX = (beamStart < enemyRight) && (beamEnd > enemyLeft);
                        const overlapY = (beamTop < enemyBottom) && (beamBottom > enemyTop);

                        if (overlapX && overlapY) {
                            // BEAM HIT
                            this.applyDamageToEnemy(this.currentEnemy);
                            p.hitEnemies.push(this.currentEnemy.id);
                        }
                    }
                }
                // STANDARD PROJECTILE (Distance Check)
                else {
                    const dist = Math.abs(p.x - (this.currentEnemy.x + this.currentEnemy.width / 2));
                    // Tighter hitbox (was 50)
                    if (dist < 30) {
                        // Hit!
                        p.active = false;
                        this.applyDamageToEnemy(this.currentEnemy);
                    }
                }
            }

            // Enemy Projectile vs Player
            if (p.type === 'laser' || p.type === 'spear' || p.type === 'rock') {
                const dist = Math.abs(p.x - (this.player.x + this.player.width / 2));
                // Tighter hitbox
                if (dist < 30) {
                    // Hit!
                    p.active = false;
                    this.applyDamageToPlayer(1);
                }
            }
        });

        // Update Loot (Touch Collection)
        this.loot.forEach(l => {
            // Check collision with player (Simple X-axis check since both are on ground)
            const playerCenter = this.player.x + this.player.width / 2;
            const dist = Math.abs(playerCenter - l.x);
            const pickupRange = 60; // Generous range

            if (dist < pickupRange) {
                l.active = false;
                this.levelGold++;
                // Update global resources logic if needed
                if (RESOURCES) RESOURCES.addGold(1);
                this.audioManager.playCollect();
            }
        });
        this.loot = this.loot.filter(l => l.active);

        // Decay Shake (Faster decay: speed 10 instead of 5)
        if (this.screenShake > 0) this.screenShake -= deltaTime * 10;
        if (this.screenShake < 0) this.screenShake = 0;

        // Camera Zoom Interpolation (Smooth)
        const zoomDiff = this.targetZoom - this.currentZoom;
        if (Math.abs(zoomDiff) > 0.01) {
            this.currentZoom += zoomDiff * deltaTime * 2; // Speed 2
        } else {
            this.currentZoom = this.targetZoom;
        }

        // Cinematic Logic
        if (this.gameState === 'CINEMATIC') {
            this.cinematicTimer += deltaTime;

            // --- PHASE 1: CHARGE ---
            if (this.cinematicPhase === 'CHARGE') {
                // Player Charge (No Shake)
                if (this.cinematicTimer >= 1.5) {
                    this.firePlayerProjectile(); // To ATTACK phase
                }
            }
            else if (this.cinematicPhase === 'ENEMY_CHARGE') {
                // Enemy Charge (No Shake)
                if (this.cinematicTimer >= 1.5) {
                    this.fireEnemyProjectile(); // To ENEMY_ATTACK phase
                }
            }

            // --- PHASE 2: ATTACK FLIGHT ---
            else if (this.cinematicPhase === 'ATTACK' || this.cinematicPhase === 'ENEMY_ATTACK') {
                // Camera holds setBattleView position
            }

            // --- PHASE 3: IMPACT WAIT ---
            else if (this.cinematicPhase === 'IMPACT_WAIT') {
                // If Enemy Died
                if (this.currentEnemy && this.currentEnemy.state === 'dead') {
                    this.finishCombat(true);
                    return;
                }

                // Wait for damage flash to finish
                if (this.currentEnemy && this.currentEnemy.isFlashing) {
                    return;
                }

                // If Player Died
                if (this.player.hp <= 0) {
                    // Logic handled in finish/damage
                }
                // Reset Turn if nobody is flashing/dying and time is up
                else if (this.cinematicTimer >= 1.25) { // Slightly shorter wait (was 1.5)
                    this.resetTurn();
                }
            }
        }

        if (this.gameState === 'EXPLORE' || this.gameState === 'LOOTING') {
            this.player.update(deltaTime);
            this.player.vx = 200;

            // Camera follows player normal
            this.cameraX = this.player.x - 200;
            this.targetZoom = 1.75; // Adjusted base zoom
            this.cameraFocusX = 0; // Reset focus to Player

            for (const enemy of this.enemies) {
                if (enemy.state === 'dead') continue;

                const dist = enemy.x - this.player.x;
                if (dist < 300 && dist > 0) { // Stop earlier
                    this.startCombat(enemy);
                    break;
                }
            }

            const lastEnemy = this.enemies[this.enemies.length - 1];
            if (lastEnemy && lastEnemy.state === 'dead') {
                if (this.levelInfo.isBoss) {
                    // For Boss: End level ONLY when all loot collected
                    if (this.loot.length === 0) {
                        this.completeLevel();
                    }
                } else if (this.player.x > lastEnemy.x + 300) {
                    // For regular levels: Walk off screen/past enemy
                    this.completeLevel();
                }
            }

        } else if (this.gameState === 'COMBAT_WAIT' || this.gameState === 'COMBAT_ACTION' || this.gameState === 'CINEMATIC' || this.gameState === 'VICTORY') {
            this.player.vx = 0;

            if (this.gameState === 'VICTORY') {
                this.victoryTimer += deltaTime;

                // Wait for zoom to reach target and 1s delay
                const zoomReached = Math.abs(this.currentZoom - 1.75) < 0.05;
                if (zoomReached && this.victoryTimer > 1.0) {
                    if (this.levelInfo.isBoss) {
                        this.completeLevel();
                    } else {
                        this.gameState = 'EXPLORE';
                        this.currentEnemy = null;
                    }
                }
            }
        }
    }

    startCombat(enemy) {
        this.gameState = 'COMBAT_WAIT';
        this.currentEnemy = enemy;
        this.combatMessage = `MÓW: "${enemy.word.toUpperCase()}"`;
        this.combatFeedback = "Naciśnij mikrofon";
        this.interimSpeech = "";
        this.speechManager.stop();
    }

    startListening() {
        if (this.gameState !== 'COMBAT_WAIT') return;

        this.combatFeedback = "Słucham...";
        this.speechManager.startListening(
            this.currentEnemy.word,
            () => this.handleCorrectWord(),
            (input) => this.handleWrongWord(input),
            () => {
                // On End (Timeout/Error/Stop)
                // If we are still in WAIT mode and feedback says Listening, reset it.
                if (this.gameState === 'COMBAT_WAIT' && this.combatFeedback === "Słucham...") {
                    this.combatFeedback = "Naciśnij mikrofon";
                    this.interimSpeech = "";

                    // TTS "Powtórz"
                    if ('speechSynthesis' in window) {
                        const utter = new SpeechSynthesisUtterance("Powtórz");
                        utter.lang = 'pl-PL';
                        window.speechSynthesis.speak(utter);
                    }
                }
            },
            (text) => {
                this.interimSpeech = text;
            }
        );
    }

    stopListening() {
        this.speechManager.stop();
        this.interimSpeech = "";
    }

    handleCorrectWord() {
        this.interimSpeech = "";
        this.startCinematic('player');
    }

    startCinematic(who) {
        this.gameState = 'CINEMATIC';
        this.cinematicTimer = 0;
        this.stopListening();
        this.combatFeedback = "";
        this.combatMessage = "";

        // Single Static "Battle View"
        this.setBattleView();

        if (who === 'player') {
            this.cinematicPhase = 'CHARGE';
        } else {
            this.cinematicPhase = 'ENEMY_CHARGE';
        }
    }

    setBattleView() {
        if (!this.player || !this.currentEnemy) return;

        const midX = (this.player.x + this.currentEnemy.x) / 2;
        const dist = Math.abs(this.player.x - this.currentEnemy.x);

        // ZOOM CALCULATION
        // We want tight framing: dist + minimal padding
        const padding = 50; // VERY TIGHT
        let zoom = 800 / (dist + padding);

        // Clamp Zoom (Max 3.5, Min 1.5) - Allow closer zoom now that base is 2.5
        if (zoom > 3.5) zoom = 3.5;
        if (zoom < 1.5) zoom = 1.5;

        this.targetZoom = zoom;

        // Focus Offset from Player's original 'cameraX' target (player.x - 200)
        // We want effectiveCameraX to be centered on midX.
        // effectiveCameraX = cameraX + focusOffset
        // midX - (CanvasWidth/2 / Zoom) = cameraX + focusOffset
        // Simpler: Just make cameraFocusX the offset from Player to Midpoint
        this.cameraFocusX = midX - this.player.x;
    }

    firePlayerProjectile() {
        this.cinematicPhase = 'ATTACK';
        this.cinematicTimer = 0;
        this.combatFeedback = "ATAK!";

        // Spawn Projectile
        let type = 'shield';
        let startX = this.player.x + 80;
        let startY = this.player.y + 35; // Default (Hand height)

        if (this.player.heroType === 'spiderman') {
            type = 'web';
        } else if (this.player.heroType === 'ironman') {
            type = 'repulsor';
            startY = this.player.y + 30; // Hand
        } else if (this.player.heroType === 'cyclops') {
            type = 'optic';
            startY = this.player.y + 15; // Eyes (Higher)
            startX = this.player.x + 50; // Head Center
        } else if (this.player.heroType === 'darkphoenix') {
            type = 'phoenix';
            startY = this.player.y + 20; // Chest height
        } else if (this.player.heroType === 'thor') {
            type = 'lightning';
            startY = this.player.y + 20;
        } else if (this.player.heroType === 'IronManHulkBuster') {
            type = 'buster_laser';
            // Center of sprite (width 150) -> +75. 
            // Reactor slightly left of center -> -10 -> +65
            startX = this.player.x + 65;
            type = 'buster_laser';
            // Center of sprite (width 150) -> +75. 
            // Reactor slightly left of center -> -10 -> +65
            startX = this.player.x + 65;
            startY = this.player.y + 45; // Chest height (relative to 130 height)
        } else if (this.player.heroType === 'capitandamaged') {
            type = 'hammer';
            startY = this.player.y + 20;
        }

        // Target override for ALL projectiles (Shoot straight)
        // User requested: "Niech zawszed kazdy strzal leci idealnie prosto"
        let targetY = startY;

        // Old logic used: this.currentEnemy.y + this.currentEnemy.height / 2;
        // But we want 0 degree angle now.

        const p = new Projectile(this.game, startX, startY, type, this.currentEnemy.x + this.currentEnemy.width / 2, targetY);
        this.projectiles.push(p);
    }

    fireEnemyProjectile() {
        this.cinematicPhase = 'ENEMY_ATTACK';
        this.cinematicTimer = 0;

        // Enemy Attacks with Laser, Spear, or Rock based on type
        const startX = this.currentEnemy.x + 10;
        // Aim from center-ish of enemy height to avoid "shooting from feet" or "shooting from top" weirdness if size differs
        const startY = this.currentEnemy.y + (this.currentEnemy.height * 0.4);

        // Projectile Type
        let type = 'laser';
        if (this.currentEnemy.enemyType === 'lizard') type = 'spear';
        if (this.currentEnemy.enemyType === 'gorilla') type = 'rock';

        // User requested: "leci w sam środek postaci gracza"
        const targetX = this.player.x + (this.player.width / 2);
        const targetY = this.player.y + (this.player.height / 2);

        const p = new Projectile(this.game, startX, startY, type, targetX, targetY);
        this.projectiles.push(p);
    }

    applyDamageToEnemy(enemy) {
        // Shake
        this.screenShake = 10;
        enemy.hp -= this.player.attackStat;
        this.combatFeedback = `TRAFIONY! -${this.player.attackStat}`;
        this.audioManager.playHit();

        // Create Flash Effect
        enemy.flash();

        // Enter Impact Wait
        this.cinematicPhase = 'IMPACT_WAIT';
        this.cinematicTimer = 0;

        // Don't change Camera (Keep Battle View)

        if (enemy.hp <= 0) {
            this.combatFeedback = "POKONANY!";
            // Logic waits for flash in update loop, then dies
        } else {
            enemy.word = enemy.getRandomWord();
            // Logic waits for timer in update loop
        }
    }

    handleWrongWord(input) {
        // Check for Homophones/Mishearings
        const cleanInput = input ? input.trim() : '';
        const target = this.currentEnemy.word;

        // Check direct mapping or inclusion
        if (HOMOPHONES[cleanInput] === target ||
            (cleanInput.includes(' ') && cleanInput.split(' ').some(w => HOMOPHONES[w] === target))) {
            console.log(`Homophone Match: ${cleanInput} -> ${target}`);
            this.handleCorrectWord();
            return;
        }

        this.interimSpeech = "";
        this.combatFeedback = `ŹLE! Słyszałem: "${input || '?'}"`;
        this.startCinematic('enemy');
    }

    applyDamageToPlayer(amount) {
        this.screenShake = 20; // Big shake
        this.audioManager.playHit();
        this.player.takeDamage(amount);
        this.combatFeedback = "AŁA! -1 HP";

        // Enter Impact Wait
        this.cinematicPhase = 'IMPACT_WAIT';
        this.cinematicTimer = 0;

        // Don't change Camera (Keep Battle View)

        if (this.player.hp <= 0) {
            // CONSUME RENTAL ON DEATH
            RESOURCES.consumeRental(this.player.heroType);
            this.combatFeedback = "KONIEC GRY";
            setTimeout(() => {
                import('./MenuState.js').then(m => {
                    this.game.setState(new m.MenuState());
                });
            }, 2000);
        }
        // Logic waits for timer in update loop then resets
    }

    resetTurn() {
        this.targetZoom = 1.75;
        this.cameraFocusX = 0;
        this.cinematicPhase = 'NONE';
        this.startCombat(this.currentEnemy);
    }

    finishCombat(win) {
        this.combatMessage = "";
        this.combatFeedback = "";

        if (win) {
            // START LOOTING SEQUENCE (Keep Camera Tight)
            this.gameState = 'LOOTING';

            let coins = 1;

            if (this.currentEnemy.isBoss) {
                coins = 100;
                // No multiplier for boss as requested
            } else {
                // HP Based Drop Logic
                const hp = this.currentEnemy.maxHp;
                let min = 1;
                let max = 5;

                if (hp >= 7 && hp <= 9) {
                    min = 2;
                    max = 6;
                } else if (hp >= 10) {
                    min = 3;
                    max = 7;
                }

                // Random between min and max (inclusive)
                coins = Math.floor(Math.random() * (max - min + 1)) + min;

                // Apply Money Multiplier (Non-Boss Only)
                // User Logic: Multiplier 4x -> Apply 2x. Multiplier 3x -> Apply 1.5x.
                // Formula: calculatedCoins * (multiplier / 2)
                const multiplierFactor = this.player.moneyMultiplier / 2;
                coins = Math.ceil(coins * multiplierFactor);

                if (coins < 1) coins = 1; // Minimum 1 always
            }

            // Spawn Loot Visuals (Compact Pile for large amounts)
            const overlap = 20;
            const maxPerRow = 15; // Max 15 items wide (~300px)

            // Center the pile on the enemy
            // Width of one full row
            const pileWidth = (Math.min(coins, maxPerRow) - 1) * overlap;
            const enemyCenterX = this.currentEnemy.x + this.currentEnemy.width / 2;
            const startX = enemyCenterX - (pileWidth / 2);

            for (let i = 0; i < coins; i++) {
                const row = Math.floor(i / maxPerRow);
                const col = i % maxPerRow;

                // Stagger alternate rows slightly for "pile" look
                const rowOffset = (row % 2 === 0) ? 0 : (overlap / 2);

                this.loot.push({
                    x: startX + (col * overlap) + rowOffset,
                    y: 0, // Placeholder
                    offsetY: row * 12, // Stack upwards
                    active: true
                });
            }

            console.log(`Looted ${coins} coins`);
            // RESOURCES.addGold(coins); // REMOVED: Gold is added when loot is collected by collision
        } else {
            // Game Over logic handled in applyDamageToPlayer
            this.gameState = 'EXPLORE'; // Fallback
            this.currentEnemy = null;
            this.targetZoom = 1.25;
            this.cameraFocusX = 0;
        }
    }

    completeLevel() {
        console.log("Level Complete!");
        // Bonus for completing level
        RESOURCES.addGold(10);
        this.gameState = 'SUCCESS';
        this.audioManager.playFanfare();
    }

    exitLevel() {
        // Unlock next
        import('../engine/LevelManager.js').then(lm => {
            const manager = new lm.LevelManager();
            manager.currentLevel = this.levelInfo.level; // FIX: Update current level so unlock works
            manager.unlockNext();

            import('./MapState.js').then(module => {
                this.game.setState(new module.MapState());
            });
        });
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        if (this.bgImage.complete && this.bgImage.naturalWidth > 0) {
            const pattern = ctx.createPattern(this.bgImage, 'repeat-x');
            ctx.fillStyle = pattern;
            // Parallax factor 0.2
            ctx.translate(-(this.cameraX * 0.2) % this.bgImage.width, 0);
            ctx.fillRect((this.cameraX * 0.2) % this.bgImage.width, 0, ctx.canvas.width + this.bgImage.width, ctx.canvas.height);
        } else {
            // Fallback while loading
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
        ctx.restore();

        ctx.save();

        // DYNAMIC ZOOM
        ctx.scale(this.currentZoom, this.currentZoom);

        // Adjust translation to account for zoom and shake
        let shakeX = (Math.random() - 0.5) * this.screenShake;
        let shakeY = (Math.random() - 0.5) * this.screenShake;

        // Center shift to keep camera aimed at cameraX + focusOffset
        const effectiveCameraX = this.cameraX + this.cameraFocusX;

        ctx.translate(-effectiveCameraX + shakeX, shakeY);

        // Ground Pinned to Bottom (considering Zoom)
        const effectiveHeight = ctx.canvas.height / this.currentZoom;
        const groundHeight = 100;

        ctx.fillStyle = '#1f2937';
        // Draw extra wide ground to cover shake/zoom edges
        // We use cameraX for ground intersection to ensure it covers the view, but effectiveCameraX determines view
        ctx.fillRect(effectiveCameraX - 1000, effectiveHeight - groundHeight, ctx.canvas.width + 2000, groundHeight + 100);

        if (this.player) {
            // Adjust player Y to sit on ground
            this.player.y = effectiveHeight - groundHeight - this.player.height + 20;
            this.player.draw(ctx);
        }

        this.enemies.forEach(e => {
            // Adjust enemy Y
            e.y = effectiveHeight - groundHeight - e.height + 20;
            e.draw(ctx);
        });

        this.projectiles.forEach(p => p.draw(ctx));

        // Draw Loot (Standard)
        this.loot.forEach(l => {
            // Calculate ground Y
            const effectiveHeight = ctx.canvas.height / this.currentZoom;
            const groundHeight = 100;
            // distinct offset for each item (stacking)
            const drawY = effectiveHeight - groundHeight + 10 - (l.offsetY || 0);

            ctx.fillStyle = 'white'; // Default text color?
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Slight random bounce or hover could be nice, but static pile is fine
            ctx.fillText('💎', l.x, drawY);
        });

        ctx.restore();

        if (this.gameState === 'COMBAT_WAIT' || this.gameState === 'COMBAT_ACTION' || this.gameState === 'CINEMATIC') {
            // Only draw UI if not in cinematic charge
            // Only draw UI if not in cinematic charge AND camera is reset
            if (this.gameState === 'CINEMATIC') return;

            // Check if Camera is back to base zoom (1.75) before showing "Press to Speak" UI
            // This prevents the UI from appearing while the camera is still zooming out
            if (Math.abs(this.currentZoom - 1.75) > 0.05) return;

            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.font = 'bold 40px Arial';
            ctx.fillText(this.combatMessage, ctx.canvas.width / 2, ctx.canvas.height / 2 - 50);

            ctx.fillStyle = '#fbbf24';
            ctx.font = '30px Arial';
            ctx.fillText(this.combatFeedback, ctx.canvas.width / 2, ctx.canvas.height / 2 + 50);

            if (this.speechManager.isListening) {
                ctx.beginPath();
                ctx.arc(ctx.canvas.width / 2, ctx.canvas.height / 2 + 120, 30, 0, Math.PI * 2);
                ctx.fillStyle = 'red';
                ctx.fill();

                // Draw Interim Text
                if (this.interimSpeech) {
                    ctx.fillStyle = '#9ca3af'; // Gray-400
                    ctx.font = '16px Arial';
                    ctx.fillText(this.interimSpeech, ctx.canvas.width / 2, ctx.canvas.height / 2 + 160);
                }
            }
        }

        if (this.gameState === 'SUCCESS') {
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#facc15'; // Yellow-400
            ctx.font = 'bold 60px Arial';
            ctx.fillText("POZIOM UKOŃCZONY!", ctx.canvas.width / 2, ctx.canvas.height / 2 - 50);

            ctx.fillStyle = '#facc15';
            ctx.font = '30px Arial';
            ctx.fillText("NAGRODA: +10 💎", ctx.canvas.width / 2, ctx.canvas.height / 2);

            ctx.fillStyle = 'white';
            ctx.font = '30px Arial';
            ctx.fillText("Kliknij, aby grać dalej", ctx.canvas.width / 2, ctx.canvas.height / 2 + 50);
        }
    }
}
