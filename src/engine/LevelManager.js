export class LevelManager {
    constructor() {
        this.currentLevel = 1;
        this.maxLevel = 21;
        this.unlockedLevels = 1; // Default starts at 1

        // Load from storage
        const saved = localStorage.getItem('avengers_save');
        if (saved) {
            const data = JSON.parse(saved);
            this.unlockedLevels = data.unlockedLevels || 1;
        }
    }

    save() {
        const data = {
            unlockedLevels: this.unlockedLevels
        };
        localStorage.setItem('avengers_save', JSON.stringify(data));
    }

    unlockNext() {
        if (this.currentLevel === this.unlockedLevels && this.unlockedLevels < this.maxLevel) {
            this.unlockedLevels++;
            this.save();
        }
    }

    getLevelInfo(level) {
        let biome = 'city';
        if (level > 7) biome = 'jungle';
        if (level > 14) biome = 'lab';

        const section = Math.ceil(level / 7);
        const stageInSection = (level - 1) % 7 + 1; // 1-7

        // Formula: Base based on stage + Section
        // 1->2, 2->3, 3->4, 4->4, 5->5, 6->6, 7->8
        const baseCounts = [0, 2, 3, 4, 4, 5, 6, 8];
        const enemyCount = baseCounts[stageInSection] + section;

        const isBoss = stageInSection === 7;

        return {
            level,
            biome,
            enemyCount,
            isBoss,
            unlocked: level <= this.unlockedLevels
        };
    }
}
