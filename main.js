import './style.css'
import { Game } from './src/engine/Game.js'

// Simple debug
console.log("Avengers Game Initializing...");

import { MenuState } from './src/ui/MenuState.js'

window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    window.game = game;
    game.setState(new MenuState());
    console.log("Game Engine Started with Menu");
});
