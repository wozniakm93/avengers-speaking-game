export class ResourceManager {
    constructor() {
        this.gold = 0;
        this.heroRentals = { captain: 9999 }; // Captain is free/infinite
        this.selectedHero = 'captain';

        this.load();
    }

    load() {
        const saved = localStorage.getItem('avengers_resources');
        if (saved) {
            const data = JSON.parse(saved);
            this.gold = data.gold || 0;
            this.selectedHero = data.selectedHero || 'captain';

            // Migrate old unlockedHeroes to rentals if needed
            if (data.unlockedHeroes) {
                this.heroRentals = { captain: 9999 };
                data.unlockedHeroes.forEach(h => {
                    if (h !== 'captain') this.heroRentals[h] = 3; // Gift 3 rentals for old unlocks
                });
            } else {
                this.heroRentals = data.heroRentals || { captain: 9999 };
            }
        } else {
            // New Game - Start with 20 Gold
            this.gold = 20;
        }
    }

    save() {
        const data = {
            gold: this.gold,
            heroRentals: this.heroRentals,
            selectedHero: this.selectedHero
        };
        // localStorage.setItem('avengers_resources', JSON.stringify(data));
        // Using console for debug
        console.log("Saving Resources:", data);
        localStorage.setItem('avengers_resources', JSON.stringify(data));
    }

    addGold(amount) {
        this.gold += amount;
        this.save();
    }

    rentHero(heroId, cost) {
        // Limit to 1 rental at a time
        if (this.heroRentals[heroId] && this.heroRentals[heroId] >= 1) {
            return false;
        }

        if (this.gold >= cost) {
            this.gold -= cost;
            if (!this.heroRentals[heroId]) this.heroRentals[heroId] = 0;
            this.heroRentals[heroId]++;
            this.save();
            return true;
        }
        return false;
    }

    consumeRental(heroId) {
        if (heroId === 'captain') return true;
        if (this.heroRentals[heroId] && this.heroRentals[heroId] > 0) {
            this.heroRentals[heroId]--;
            // If ran out, auto-switch to captain next time?
            if (this.heroRentals[heroId] <= 0) {
                this.selectedHero = 'captain';
            }
            this.save();
            return true;
        }
        return false;
    }

    selectHero(heroId) {
        if (heroId === 'captain' || (this.heroRentals[heroId] && this.heroRentals[heroId] > 0)) {
            this.selectedHero = heroId;
            this.save();
            return true;
        }
        return false;
    }
}

// Global instance
export const RESOURCES = new ResourceManager();
