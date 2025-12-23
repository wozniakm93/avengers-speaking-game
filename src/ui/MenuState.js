import { State } from '../engine/State.js';
import { MapState } from './MapState.js';
import { CharacterSelectionState } from './CharacterSelectionState.js';

export class MenuState extends State {
    constructor() {
        super();
    }

    enter(game) {
        super.enter(game);
        this.createMainMenu();
    }

    createMainMenu() {
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
        // Import RESOURCES to use
        import('../engine/ResourceManager.js').then(m => {
            goldEl.innerText = `💎 ${m.RESOURCES.gold}`;
        });
        ui.appendChild(goldEl);

        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'flex-start'; // Align to top
        container.style.gap = '1rem'; // Reduced gap
        container.style.zIndex = '20';
        container.style.marginTop = '100px'; // Move down from very top, but higher than center

        // --- DYNAMIC HERO BACKGROUND (Lineup) ---
        const heroLineup = document.createElement('div');
        heroLineup.style.display = 'flex';
        heroLineup.style.alignItems = 'flex-end'; // Align feet
        heroLineup.style.justifyContent = 'center';
        heroLineup.style.marginBottom = '-20px'; // Overlap with title slightly? Or just space.

        const heroes = ['thor', 'ironman', 'captain', 'spiderman', 'darkphoenix', 'cyclops'];

        heroes.forEach((id, index) => {
            const img = document.createElement('img');
            img.src = `/src/assets/spr_${id}.png`;
            img.style.height = '220px'; // Good visibility size
            img.style.objectFit = 'contain';
            img.style.opacity = '0.85'; // Slight transparency as requested
            img.style.transition = 'transform 0.3s';

            // Overlap logic
            if (index > 0) {
                img.style.marginLeft = '-90px'; // Significant overlap (Was -60px)
            }

            // Z-Index for depth (Center in front, sides back? Or nice stack)
            // Let's stack them: First is back, last is front? Or manual z-index.
            // visual: Thor(0), Iron(1), Cap(2), Spider(3)...
            // Let's make Captain (index 2) appear most "front" if possible, or just standard stack.
            // Standard DOM order means later items are on top.
            // To make "Center Front", allow default stacking or tweak z-index.
            // Let's keep it simple: nice stack left to right.
            img.style.zIndex = index;

            // Hover effect for fun
            img.onmouseenter = () => { img.style.transform = 'scale(1.1) translateY(-10px)'; img.style.opacity = '1'; img.style.zIndex = '100'; };
            img.onmouseleave = () => { img.style.transform = 'scale(1)'; img.style.opacity = '0.85'; img.style.zIndex = index; };

            heroLineup.appendChild(img);
        });

        const title = document.createElement('h1');
        title.className = 'title';
        title.innerText = "AVENGERS\nVOICE BATTLE";
        title.style.textAlign = 'center';

        const btnPlay = document.createElement('button');
        btnPlay.innerText = "GRAJ";
        btnPlay.className = 'btn-primary interactive';
        btnPlay.onclick = () => {
            console.log("Play Clicked");
            this.game.setState(new MapState());
        };

        const btnHeroes = document.createElement('button');
        btnHeroes.innerText = "BOHATEROWIE";
        btnHeroes.className = 'btn-primary interactive';
        btnHeroes.style.filter = 'hue-rotate(45deg)';
        btnHeroes.onclick = () => {
            console.log("Heroes Clicked");
            this.game.setState(new CharacterSelectionState());
        };

        container.appendChild(heroLineup); // Add Heroes first
        container.appendChild(title);
        container.appendChild(btnPlay);
        container.appendChild(btnHeroes);
        ui.appendChild(container);
    }

    exit() {
        const ui = document.getElementById('ui-layer');
        ui.innerHTML = '';
        super.exit();
    }

    draw(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
        gradient.addColorStop(0, '#1e3a8a');
        gradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}
