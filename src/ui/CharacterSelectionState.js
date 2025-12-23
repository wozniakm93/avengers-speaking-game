import { State } from '../engine/State.js';
import { MenuState } from './MenuState.js';
import { RESOURCES } from '../engine/ResourceManager.js';

export class CharacterSelectionState extends State {
    constructor() {
        super();
    }

    enter(game) {
        super.enter(game);
        console.log("Entering Character Selection");
        this.createUI();

        // TTS Announcement
        if ('speechSynthesis' in window) {
            const utter = new SpeechSynthesisUtterance("Wypożyczalnia Bohaterów");
            utter.lang = 'pl-PL';
            window.speechSynthesis.speak(utter);
        }
    }

    createUI() {
        const ui = document.getElementById('ui-layer');
        ui.innerHTML = '';

        const container = document.createElement('div');
        container.className = 'interactive'; // Allow scrolling/clicking
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.overflowY = 'auto'; // Enable vertical scroll
        container.style.background = 'rgba(0,0,0,0.8)';
        container.style.padding = '20px'; // Add padding
        container.style.paddingBottom = '100px'; // Ensure bottom button is visible

        const title = document.createElement('h2');
        title.innerText = "WYBIERZ BOHATERA";
        title.className = 'title';
        title.style.fontSize = '2.5rem';

        // Gold Display (Top Right Consistency)
        const goldEl = document.createElement('div');
        goldEl.style.position = 'absolute';
        goldEl.style.top = '20px';
        goldEl.style.right = '20px';
        goldEl.innerText = `💎 ${RESOURCES.gold}`;
        goldEl.style.color = '#facc15';
        goldEl.style.fontSize = '2rem';
        goldEl.style.fontWeight = 'bold';
        goldEl.style.textShadow = '0 2px 4px black';
        ui.appendChild(goldEl);

        // Remove old inline gold display
        // const goldDisplay = document.createElement('div'); ...

        const heroesContainer = document.createElement('div');
        heroesContainer.style.display = 'flex';
        heroesContainer.style.flexWrap = 'wrap'; // Allow wrapping
        heroesContainer.style.justifyContent = 'center'; // Center items
        heroesContainer.style.maxWidth = '1200px'; // Restrict width for better readability
        heroesContainer.style.gap = '2rem';
        heroesContainer.style.marginBottom = '120px'; // Space for fixed back button

        // Captain America (4HP, 4ATK) - FREE. Stats: 3/3, Money 1x
        heroesContainer.appendChild(this.createHeroCard('captain', 'Captain America', 0, 3, 3, 1));

        // Spiderman (4HP, 3ATK) - Rental 25g. Money 2x
        heroesContainer.appendChild(this.createHeroCard('spiderman', 'Spiderman', 25, 3, 4, 2));

        // IronMan (6ATK, 4HP). Money 6x. Cost 60
        heroesContainer.appendChild(this.createHeroCard('ironman', 'Iron Man', 60, 2, 4, 6));

        // Cyclops (5ATK, 2HP). Money 2x. Cost 70
        heroesContainer.appendChild(this.createHeroCard('cyclops', 'Cyclops', 70, 2, 5, 2));

        // Dark Phoenix (8ATK, 5HP). Money 3x. Cost 130
        heroesContainer.appendChild(this.createHeroCard('darkphoenix', 'Dark Phoenix', 130, 5, 8, 3));

        // Thor (7ATK, 4HP). Money 4x. Cost 110
        heroesContainer.appendChild(this.createHeroCard('thor', 'Thor', 110, 4, 7, 4));

        // Hulkbuster (8ATK, 4HP). Money 4x. Cost 120
        heroesContainer.appendChild(this.createHeroCard('IronManHulkBuster', 'Hulkbuster', 120, 4, 8, 4));

        // Captain Damaged (Hammer) (6ATK, 2HP). Money 2x. Cost 80
        heroesContainer.appendChild(this.createHeroCard('capitandamaged', 'Kapitan Młot', 80, 2, 6, 2));

        const btnBack = document.createElement('button');
        btnBack.innerText = "WSTECZ";
        btnBack.className = 'btn-primary interactive';
        // Fix Position to ensure visibility always
        btnBack.style.position = 'fixed';
        btnBack.style.bottom = '30px';
        btnBack.style.zIndex = '100';
        btnBack.style.marginTop = '0';

        btnBack.onclick = () => this.game.setState(new MenuState());

        container.appendChild(title);
        // container.appendChild(goldDisplay); // Removed
        container.appendChild(heroesContainer);
        container.appendChild(btnBack);
        ui.appendChild(container);
    }

    createHeroCard(id, name, cost, hp, atk, money) {
        const count = RESOURCES.heroRentals[id] || 0;
        const isFree = (id === 'captain');
        const isSelected = RESOURCES.selectedHero === id;

        const card = document.createElement('div');
        card.style.background = isSelected ? 'linear-gradient(45deg, #1e3a8a, #2563eb)' : '#1f2937';
        card.style.padding = '20px';
        card.style.borderRadius = '15px';
        card.style.border = isSelected ? '4px solid #f59e0b' : '2px solid #4b5563';
        card.style.width = '200px';
        card.style.textAlign = 'center';
        card.className = 'panel';

        // Avatar
        const avatar = document.createElement('img');
        avatar.src = `/src/assets/spr_${id}.png`;
        avatar.style.width = '100px';
        avatar.style.height = '100px';
        avatar.style.objectFit = 'contain';
        avatar.style.marginBottom = '10px';

        const nameEl = document.createElement('h3');
        nameEl.innerText = name;
        nameEl.style.margin = '10px 0';

        const statsEl = document.createElement('div');
        statsEl.style.fontSize = '1.1rem';
        statsEl.style.marginBottom = '5px';
        statsEl.innerHTML = `
            <div>${'❤️'.repeat(hp)}</div>
            <div>${'⚔️'.repeat(atk)}</div>
            <div style="color:#facc15">💰 ${money}x</div>
        `;

        const countEl = document.createElement('div');
        countEl.style.color = '#9ca3af';
        countEl.style.marginBottom = '10px';
        countEl.innerText = isFree ? "ZAWSZE DOSTĘPNY" : `DOSTĘPNE: ${count}`;

        // Buttons Container
        const btnContainer = document.createElement('div');
        btnContainer.style.display = 'flex';
        btnContainer.style.flexDirection = 'column';
        btnContainer.style.gap = '10px';

        // SELECT BUTTON
        const selectBtn = document.createElement('button');
        selectBtn.className = 'interactive';
        selectBtn.style.padding = '5px';
        selectBtn.style.borderRadius = '5px';
        selectBtn.style.fontWeight = 'bold';

        if (isSelected) {
            selectBtn.innerText = "WYBRANY";
            selectBtn.style.background = '#10b981';
            selectBtn.disabled = true;
        } else if (isFree || count > 0) {
            selectBtn.innerText = "WYBIERZ";
            selectBtn.style.background = '#3b82f6';
            selectBtn.innerText = "WYBIERZ";
            selectBtn.style.background = '#3b82f6';
            selectBtn.onclick = () => {
                RESOURCES.selectHero(id);
                this.playSelectionTTS(id);
                this.createUI();
            };
        } else {
            selectBtn.innerText = "BRAK";
            selectBtn.style.background = '#4b5563';
            selectBtn.disabled = true;
        }

        // RENT BUTTON (Only for paid heroes)
        if (!isFree) {
            const rentBtn = document.createElement('button');
            rentBtn.className = 'interactive';
            rentBtn.innerText = `WYPOŻYCZ (${cost})`;
            rentBtn.style.padding = '5px';
            rentBtn.style.borderRadius = '5px';
            rentBtn.style.background = '#f59e0b'; // Gold
            rentBtn.style.color = 'black';
            rentBtn.style.color = 'black';

            if (count >= 1) {
                rentBtn.innerText = "POSIADASZ";
                rentBtn.style.background = '#6b7280'; // Gray
                rentBtn.disabled = true;
            } else {
                rentBtn.onclick = () => {
                    this.showConfirmDialog(id, name, cost);
                };
            }

            btnContainer.appendChild(rentBtn);
        }

        btnContainer.appendChild(selectBtn);

        card.appendChild(avatar);
        card.appendChild(nameEl);
        card.appendChild(statsEl);
        card.appendChild(countEl);
        card.appendChild(btnContainer);

        return card;
    }

    showConfirmDialog(id, name, cost) {
        const ui = document.getElementById('ui-layer');

        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0,0,0,0.85)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '100';

        const box = document.createElement('div');
        box.style.background = '#1f2937';
        box.style.padding = '30px';
        box.style.borderRadius = '15px';
        box.style.border = '2px solid #f59e0b';
        box.style.textAlign = 'center';
        box.style.maxWidth = '400px';

        const msg = document.createElement('h3');
        msg.innerText = `Czy na pewno chcesz wypożyczyć bohatera ${name} za ${cost} złota?`;
        msg.style.marginBottom = '20px';

        const btnContainer = document.createElement('div');
        btnContainer.style.display = 'flex';
        btnContainer.style.justifyContent = 'center';
        btnContainer.style.gap = '20px';

        const yesBtn = document.createElement('button');
        yesBtn.innerText = "TAK";
        yesBtn.className = 'interactive';
        yesBtn.style.background = '#10b981';
        yesBtn.style.padding = '10px 30px';
        yesBtn.style.borderRadius = '5px';
        yesBtn.style.fontWeight = 'bold';
        yesBtn.onclick = () => {
            if (RESOURCES.rentHero(id, cost)) {
                this.createUI(); // Removes overlay by redrawing
                // Auto-select after rent? Maybe just stay on menu
            } else {
                alert("Niestety, masz za mało złota!");
                this.createUI();
            }
        };

        const noBtn = document.createElement('button');
        noBtn.innerText = "NIE";
        noBtn.className = 'interactive';
        noBtn.style.background = '#ef4444';
        noBtn.style.padding = '10px 30px';
        noBtn.style.borderRadius = '5px';
        noBtn.style.fontWeight = 'bold';
        noBtn.onclick = () => {
            this.createUI(); // Cancel
        };

        btnContainer.appendChild(yesBtn);
        btnContainer.appendChild(noBtn);

        box.appendChild(msg);
        box.appendChild(btnContainer);
        overlay.appendChild(box);
        ui.appendChild(overlay);
    }

    playSelectionTTS(id) {
        if (!('speechSynthesis' in window)) return;

        let name = id;
        if (id === 'captain') name = "Kapitana Amerykę";
        if (id === 'spiderman') name = "Spajdermena";
        if (id === 'ironman') name = "Ironmena";
        if (id === 'cyclops') name = "Cyklopa";
        if (id === 'darkphoenix') name = "Dark Feniks";
        if (id === 'thor') name = "Tora";
        if (id === 'IronManHulkBuster') name = "Hulkbastera";
        if (id === 'capitandamaged') name = "Kapitana z Młotem";

        const utter = new SpeechSynthesisUtterance(`Wybrałeś ${name}`);
        utter.lang = 'pl-PL';
        window.speechSynthesis.speak(utter);
    }

    exit() {
        const ui = document.getElementById('ui-layer');
        ui.innerHTML = '';
        super.exit();
    }
}
