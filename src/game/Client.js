export default class Client {
    constructor() {
        this.x = -100;
        this.y = 300;
        this.targetX = 250;
        this.speed = 1.5;
        this.scale = 1;
        this.isWalking = true;
        this.isLeaving = false;
        this.isAngry = false;
        this.arrivalTime = null;
        this.waitTime = 0;
        this.clientType = 'client'; // Will be randomly set on reset
    }

    reset() {
        this.x = -100;
        this.y = 300;
        this.scale = 1;
        this.isWalking = true;
        this.isLeaving = false;
        this.isAngry = false;
        this.arrivalTime = null;
        this.waitTime = 0;
        // Randomly choose client type
        this.clientType = Math.random() > 0.5 ? 'client' : 'client2';
    }

    startLeaving() {
        this.isLeaving = true;
        this.isWalking = false;
    }

    update() {
        if (this.isLeaving) {
            // Walk away to the left
            this.x -= this.speed;
            this.y = 300 + Math.sin(frameCount * 0.2) * 3;
            this.scale = 1 + Math.sin(frameCount * 0.2) * 0.01;
            return;
        }

        if (this.isWalking && this.x < this.targetX) {
            this.x += this.speed;

            // Walk animation: bob up and down
            this.y = 300 + Math.sin(frameCount * 0.2) * 3;
            this.scale = 1 + Math.sin(frameCount * 0.2) * 0.01;

            // Check if arrived
            if (this.x >= this.targetX) {
                this.isWalking = false;
                this.arrivalTime = frameCount;
                this.waitTime = 0;
            }
        } else if (!this.isWalking) {
            // Idle: stop all animation and track wait time
            this.y = 300;
            this.scale = 1;
            this.waitTime++;

            // After 5 seconds (300 frames at 60fps), get angry
            if (this.waitTime >= 300 && !this.isAngry) {
                this.isAngry = true;
            }

            // After 10 seconds total (600 frames), leave
            if (this.waitTime >= 600) {
                this.isLeaving = true;
            }
        }
    }

    hasLeft() {
        return this.isLeaving && this.x < -100;
    }

    draw() {
        if (window.assets) {
            // Choose sprite based on client type and state
            let normalSprite = this.clientType === 'client2' ? window.assets.client2 : window.assets.client;
            let angrySprite = this.clientType === 'client2' ? window.assets.client2Angry : window.assets.clientAngry;
            let sprite = this.isAngry ? angrySprite : normalSprite;
            
            if (sprite) {
                push();
                translate(this.x, this.y);
                // Flip direction if leaving
                let flipX = this.isLeaving ? 0.4 : -0.4;
                scale(flipX, this.scale * 0.4);
                imageMode(CENTER);
                image(sprite, 0, 0);
                pop();
            }
        }
    }
}
