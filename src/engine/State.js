export class State {
    constructor() {
        this.game = null;
    }

    enter(game) {
        this.game = game;
    }

    exit() {
        this.game = null;
    }

    update(deltaTime) { }

    draw(ctx) { }
}
