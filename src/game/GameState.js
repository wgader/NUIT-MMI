import SquatDetector from './SquatDetector.js';
import BurgerBuilder from './BurgerBuilder.js';
import ParticleSystem from './ParticleSystem.js';
import Animator from './Animator.js';

export default class GameState {
    constructor() {
        this.phases = {
            MENU: 'MENU',
            CALIBRATION: 'CALIBRATION',
            SQUATTING: 'SQUATTING',
            ASSEMBLING: 'ASSEMBLING',
            GAMEOVER: 'GAMEOVER'
        };
        this.currentPhase = this.phases.MENU;
        this.score = 0;
        this.time = 45; // Start time

        // Managers
        this.squatDetector = new SquatDetector();
        this.burgerBuilder = new BurgerBuilder();
        this.particles = new ParticleSystem();
    }

    changePhase(newPhase) {
        this.currentPhase = newPhase;
        if (newPhase === this.phases.CALIBRATION) this.squatDetector.startCalibration();
        else if (newPhase === this.phases.SQUATTING) this.squatDetector.resetPower();
        else if (newPhase === this.phases.ASSEMBLING) this.burgerBuilder.newOrder();
    }

    update() {
        this.particles.update();

        // Timer Logic
        // Ensure frameCount modulo works. P5 frameCount increases every draw.
        // If phase is active...
        if (this.currentPhase === this.phases.ASSEMBLING || this.currentPhase === this.phases.SQUATTING) {
            if (frameCount % 60 === 0 && this.time > 0) {
                this.time--;
            }
            if (this.time <= 0) {
                this.currentPhase = this.phases.GAMEOVER;
            }
        }

        switch (this.currentPhase) {
            case this.phases.MENU:
                if (kb.presses('space')) this.changePhase(this.phases.CALIBRATION);
                break;
            case this.phases.CALIBRATION:
                this.squatDetector.update();
                if (this.squatDetector.isCalibrated) this.changePhase(this.phases.SQUATTING);
                break;
            case this.phases.SQUATTING:
                this.squatDetector.update();
                if (this.squatDetector.power >= 100) this.changePhase(this.phases.ASSEMBLING);
                break;
            case this.phases.ASSEMBLING:
                this.burgerBuilder.update();
                if (this.burgerBuilder.orderComplete) {
                    this.score += 100;
                    this.time += 10;
                    this.particles.emit(width / 2, height / 2, 'FIRE');
                    this.changePhase(this.phases.SQUATTING);
                }
                break;
            case this.phases.GAMEOVER:
                if (kb.presses('space')) {
                    this.score = 0;
                    this.time = 45;
                    this.changePhase(this.phases.MENU);
                }
                break;
        }
    }

    draw() {
        background(0);

        // --- 1. Background ---
        if (window.assets && window.assets.bg) {
            image(window.assets.bg, 0, 0, width, height);
        }

        // --- 2. Chef ---
        this.drawChef();

        // --- 3. UI Layout ---
        this.drawLayout();

        // --- 4. Interactive Elements ---
        if (this.currentPhase === this.phases.ASSEMBLING) {
            this.burgerBuilder.draw();
        }

        this.drawGaugeFill();
        this.particles.draw();
        this.drawPhaseOverlays();
    }

    drawChef() {
        let cx = 110;
        let cy = height - 200;

        let sprite = window.assets.chefDebout;
        if (this.squatDetector.squatState === 'DOWN') {
            sprite = window.assets.chefSquat;
        }

        if (sprite) {
            image(sprite, cx, cy, 140, 140);
        }
    }

    drawLayout() {
        // --- 1. Stats Bar (Top of Screen) ---
        fill(0, 0, 0, 200); noStroke();
        rect(0, 0, width, 30); // Stick to top

        fill(255, 255, 0); // Yellow
        textAlign(CENTER, CENTER);
        textSize(18);
        textStyle(BOLD);

        let m = Math.floor(this.time / 60);
        let s = this.time % 60;
        let timeStr = `${m}:${s < 10 ? '0' + s : s}`;

        text(`SCORE: ${this.score}      TIME: ${timeStr}`, width / 2, 15);
        textStyle(NORMAL); // Reset

        // --- 2. Recipe Frame (Pushed down) ---
        if (window.assets && window.assets.frame) {
            image(window.assets.frame, 10, 35, width - 20, 80);
        }

        // --- 3. Left Flame Gauge ---
        if (window.assets && window.assets.gauge) {
            image(window.assets.gauge, 10, 140, 90, 300);
        }
    }

    drawGaugeFill() {
        // Gauge Frame at x=10, y=140, w=90, h=300
        // Inner area approx x=35, y=165, w=40, h=250

        let power = this.squatDetector.power;
        if (power > 0) {
            let maxH = 240;
            let h = map(power, 0, 100, 0, maxH);

            let c = lerpColor(color(255, 0, 0), color(255, 255, 0), power / 100);

            fill(c); noStroke();
            rect(35, 170 + maxH - h, 40, h);
        }

        // Label
        fill(255); textAlign(CENTER); textSize(12);
        text("POWER", 55, 135);
    }

    drawPhaseOverlays() {
        switch (this.currentPhase) {
            case this.phases.MENU:
                this.drawOverlay("PANIC BURGER", "PRESS SPACE TO START");
                break;
            case this.phases.CALIBRATION:
                this.drawOverlay("CALIBRATION", "STAND UPRIGHT");
                this.squatDetector.drawSkeleton();
                break;
            case this.phases.GAMEOVER:
                this.drawOverlay("GAME OVER", `FINAL SCORE: ${this.score}`);
                break;
        }
    }

    drawOverlay(title, sub) {
        fill(0, 0, 0, 200);
        rect(0, 0, width, height);
        textAlign(CENTER);
        fill(255); textSize(40);
        text(title, width / 2, height / 2 - 20);
        textSize(20);
        text(sub, width / 2, height / 2 + 30);
    }
}
