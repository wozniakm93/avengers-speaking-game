import { State } from '../engine/State.js';
import { LevelManager } from '../engine/LevelManager.js';
import { MenuState } from './MenuState.js';
import { GameplayState } from './GameplayState.js';

export class MapState extends State {
    constructor() {
        super();
        this.levelManager = new LevelManager();
        this.scrollX = 0;
    }

    enter(game) {
        super.enter(game);
        console.log("Entering Map State");
        this.createMapUI();
    }

    createMapUI() {
        const ui = document.getElementById('ui-layer');
        ui.innerHTML = '';

        // Gold Display (Top Right)
        const goldEl = document.createElement('div');
        goldEl.style.position = 'absolute';
        goldEl.style.top = '20px';
        goldEl.style.right = '20px';
        goldEl.style.color = '#facc15';
        goldEl.style.fontSize = '2rem';
        goldEl.style.fontWeight = 'bold';
        goldEl.style.textShadow = '0 2px 4px black';
        goldEl.style.zIndex = '30';
        import('../engine/ResourceManager.js').then(m => {
            goldEl.innerText = `💎 ${m.RESOURCES.gold}`;
        });
        ui.appendChild(goldEl);

        const container = document.createElement('div');
        container.className = 'interactive';
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(7, 1fr)';
        container.style.gap = '1rem';
        container.style.padding = '2rem';
        container.style.width = '80%';
        container.style.height = '80%';
        container.style.overflowY = 'auto';

        // Back Button
        const btnBack = document.createElement('button');
        btnBack.innerText = "MENU GŁÓWNE";
        btnBack.className = 'btn-primary interactive';
        btnBack.style.position = 'absolute';
        btnBack.style.top = '20px';
        btnBack.style.left = '20px';
        btnBack.style.fontSize = '1rem';
        btnBack.style.padding = '0.5rem 1rem';
        btnBack.onclick = () => this.game.setState(new MenuState());
        ui.appendChild(btnBack);

        // Render Levels
        for (let i = 1; i <= 21; i++) {
            const info = this.levelManager.getLevelInfo(i);
            const btn = document.createElement('button');
            btn.innerText = `${i}`;
            btn.className = 'interactive';

            // Styles
            btn.style.width = '60px';
            btn.style.height = '60px';
            btn.style.borderRadius = '50%';
            btn.style.border = 'none';
            btn.style.fontSize = '1.2rem';
            btn.style.fontWeight = 'bold';
            btn.style.cursor = 'pointer';
            btn.style.transition = 'transform 0.2s';

            if (info.unlocked) {
                if (info.biome === 'city') btn.style.background = '#3b82f6';
                if (info.biome === 'jungle') btn.style.background = '#22c55e';
                if (info.biome === 'lab') btn.style.background = '#a855f7';
                btn.style.color = 'white';
                btn.style.boxShadow = '0 0 10px rgba(255,255,255,0.5)';

                btn.onclick = () => {
                    console.log(`Starting Level ${i}`);
                    this.game.setState(new GameplayState(info));
                };
            } else {
                btn.style.background = '#374151';
                btn.style.color = '#9ca3af';
                btn.style.cursor = 'not-allowed';
            }

            if (info.isBoss) {
                btn.style.border = '3px solid #ef4444';
                btn.innerText += " ☠️";
            }

            container.appendChild(btn);
        }

        ui.appendChild(container);
    }

    exit() {
        const ui = document.getElementById('ui-layer');
        ui.innerHTML = '';
        super.exit();
    }

    draw(ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}
