export default class Client {
    constructor() {
        this.baseY = 450; 
        this.startX = 500;
        this.onAngry = null; 
        this.reset();
    }

    reset() {
        this.x = this.startX;
        this.y = this.baseY;
        this.targetX = 800;
        this.speed = 1.5;
        this.scale = 1;
        this.isWalking = true;
        this.isLeaving = false;
        this.isAngry = false;
        this.arrivalTime = null;
        this.waitTime = 0;
        this.clientType = Math.random() < 0.5 ? 'client' : 'client2';
    }

    startLeaving() {
        this.isLeaving = true;
        this.isWalking = false;
    }

    update() {
        if (this.isLeaving) {
            this.x -= this.speed;
            this.y = this.baseY + Math.sin(frameCount * 0.2) * 3;
            this.scale = 1 + Math.sin(frameCount * 0.2) * 0.01;
            return;
        }

        if (this.isWalking && this.x < this.targetX) {
            this.x += this.speed;

            this.y = this.baseY + Math.sin(frameCount * 0.2) * 3;
            this.scale = 1 + Math.sin(frameCount * 0.2) * 0.01;

            if (this.x >= this.targetX) {
                this.isWalking = false;
                this.arrivalTime = frameCount;
                this.waitTime = 0;
            }
        } else if (!this.isWalking) {
            this.y = this.baseY;
            this.scale = 1;
            this.waitTime++;

            if (this.waitTime >= 300 && !this.isAngry) {
                this.isAngry = true;
                if (this.onAngry) this.onAngry();
            }

            if (this.waitTime >= 600) {
                this.isLeaving = true;
            }
        }
    }

    hasLeft() {
        return this.isLeaving && this.x <= this.startX;
    }

    draw() {
        if (window.assets) {
            let normalSprite = this.clientType === 'client2' ? window.assets.client2 : window.assets.client;
            let angrySprite = this.clientType === 'client2' ? window.assets.client2Angry : window.assets.clientAngry;
            let sprite = this.isAngry ? angrySprite : normalSprite;
            
            if (sprite) {
                push();
                translate(this.x, this.y);
                let flipX = this.isLeaving ? 0.4 : -0.4;
                scale(flipX, this.scale * 0.4);
                imageMode(CENTER);
                image(sprite, 0, 0);
                pop();
            }
        }
    }
}
