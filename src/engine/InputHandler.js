import { RESOURCES } from './ResourceManager.js';

export class InputHandler {
    constructor(game) {
        this.game = game;
        this.handleClick = this.handleClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        document.addEventListener('click', this.handleClick);
        document.addEventListener('touchstart', this.handleClick);
        document.addEventListener('keydown', this.handleKeyDown);

        // Cheat State
        this.cheatTimes = [];
        this.unlockTimes = [];
    }

    handleKeyDown(e) {
        if (e.key === 'Insert') {
            const now = Date.now();
            // Filter timestamps older than 3 seconds
            this.cheatTimes = this.cheatTimes.filter(t => now - t < 3000);
            this.cheatTimes.push(now);

            if (this.cheatTimes.length >= 10) {
                console.log("CHEAT ACTIVATED: +100 GOLD");
                RESOURCES.addGold(100);
                this.cheatTimes = []; // Reset
                if ('speechSynthesis' in window) {
                    const utter = new SpeechSynthesisUtterance("Kod na złoto");
                    utter.lang = 'pl-PL';
                    window.speechSynthesis.speak(utter);
                }
            }
        } else if (e.key === 'Home') {
            const now = Date.now();
            this.unlockTimes = this.unlockTimes.filter(t => now - t < 3000);
            this.unlockTimes.push(now);

            if (this.unlockTimes.length >= 10) {
                console.log("CHEAT ACTIVATED: UNLOCK ALL LEVELS");
                const data = { unlockedLevels: 21 }; // Max level
                localStorage.setItem('avengers_save', JSON.stringify(data));
                this.unlockTimes = []; // Reset

                // TTS Feedback
                if ('speechSynthesis' in window) {
                    const utter = new SpeechSynthesisUtterance("Odblokowano poziomy");
                    utter.lang = 'pl-PL';
                    window.speechSynthesis.speak(utter);
                }

                // Force reload to apply? Or just let user go to menu
                alert("CHEAT: Odblokowano wszystkie poziomy! Przejdź do mapy.");
            }
        }
    }

    handleClick(e) {
        if (!this.game.state) return;

        // Delegate to state if it has a handler
        if (this.game.state.handleClick) {
            this.game.state.handleClick(e);
        }
    }

    destroy() {
        document.removeEventListener('click', this.handleClick);
        document.removeEventListener('touchstart', this.handleClick);
        document.removeEventListener('keydown', this.handleKeyDown);
    }
}
