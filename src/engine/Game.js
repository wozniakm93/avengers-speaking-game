import { InputHandler } from './InputHandler.js';

export class Game {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        document.body.appendChild(this.canvas);

        this.inputHandler = new InputHandler(this);

        this.lastTime = 0;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.state = null;

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setState(newState) {
        if (this.state && this.state.exit) this.state.exit();
        this.state = newState;
        if (this.state && this.state.enter) this.state.enter(this);
    }

    loop(timestamp) {
        let deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        // Cap max Delta Time to prevent huge jumps
        if (deltaTime > 0.05) deltaTime = 0.05;

        // Clear Screen
        this.ctx.fillStyle = '#030712'; // --darker
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state) {
            if (this.state.update) this.state.update(deltaTime);
            if (this.state.draw) this.state.draw(this.ctx);
        }

        requestAnimationFrame(this.loop);
    }
}
