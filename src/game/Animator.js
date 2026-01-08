export default class Animator {
    constructor(spriteSheet, frameWidth, frameHeight, frameRate) {
        this.sheet = spriteSheet;
        this.fw = frameWidth;
        this.fh = frameHeight;
        this.frameRate = frameRate;
        this.lastFrame = 0;
        this.currentFrame = 0;
        this.row = 0;
    }

    setRow(row) {
        this.row = row;
    }

    draw(x, y, w, h) {
        if (!this.sheet) return;

        // Update Frame
        if (millis() - this.lastFrame > 1000 / this.frameRate) {
            this.currentFrame = (this.currentFrame + 1) % 4; // Assume 4 frames per row
            this.lastFrame = millis();
        }

        // Draw
        // We use the pixel art scaling
        image(
            this.sheet,
            x, y, w, h,
            this.currentFrame * this.fw, this.row * this.fh, this.fw, this.fh
        );
    }
}
