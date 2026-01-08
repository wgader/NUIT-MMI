import SquatDetector from './SquatDetector.js';
import BurgerBuilder from './BurgerBuilder.js';
import ParticleSystem from './ParticleSystem.js';
import Animator from './Animator.js';

export default class GameState {
    constructor() {
        this.phases = {
            MENU: 'MENU',
            INSTRUCTIONS: 'INSTRUCTIONS', // NEW
            CALIBRATION: 'CALIBRATION',
            SQUATTING: 'SQUATTING',
            ASSEMBLING: 'ASSEMBLING',
            GAMEOVER: 'GAMEOVER'
        };
        this.currentPhase = this.phases.MENU;
        this.score = 0;
        this.time = 60;
        this.instructionsTimer = 0; // NEW: tracks frames for auto-advance
        this.burgersCompleted = 0;

        // Managers
        this.squatDetector = new SquatDetector();
        this.burgerBuilder = new BurgerBuilder();
        this.particles = new ParticleSystem();
    }

    changePhase(newPhase) {
        this.currentPhase = newPhase;
        if (newPhase === this.phases.INSTRUCTIONS) {
            this.instructionsTimer = 0; // Reset timer
        } else if (newPhase === this.phases.CALIBRATION) {
            this.squatDetector.startCalibration();
        } else if (newPhase === this.phases.SQUATTING) {
            this.squatDetector.resetPower();
        } else if (newPhase === this.phases.ASSEMBLING) {
            this.burgerBuilder.newOrder();
        }
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
                if (kb.presses('space')) this.changePhase(this.phases.INSTRUCTIONS);
                break;
            case this.phases.INSTRUCTIONS:
                this.instructionsTimer++;
                // Auto-advance after 4 seconds (240 frames at 60fps)
                if (this.instructionsTimer > 480) {
                    this.changePhase(this.phases.CALIBRATION);
                }
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
                    this.burgersCompleted++;
                }
                break;
            case this.phases.GAMEOVER:
                if (kb.presses('space')) {
                    this.score = 0;
                    this.time = 60;
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
        // Position the chef directly beneath the left power bar
        const gaugeX = 10;
        const gaugeY = 140;
        const gaugeW = 90;
        const gaugeH = 300;
        const chefW = 140;
        const chefH = 140;
        const padding = 10; // small gap below the gauge

        // Center chef horizontally under the gauge and place just below it
        let cx = gaugeX + gaugeW / 3 - chefW / 2.5;
        let cy = gaugeY + gaugeH + padding;

        let sprite = window.assets.chefDebout;
        if (this.squatDetector.squatState === 'DOWN') {
            sprite = window.assets.chefSquat;
        }

        if (sprite) {
            image(sprite, cx, cy, chefW, chefH);
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

        text(`BURGERS: ${this.burgersCompleted}      TIME: ${timeStr}`, width / 2, 15);
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
        // Inner area will be centered inside the frame

        let power = this.squatDetector.power;
        // Inner gauge geometry (tweak innerW to change width)
        const gaugeX = 10;
        const gaugeW = 90;
        const innerW = 30; // width of the progression bar
        const innerX = gaugeX + Math.round((gaugeW - innerW) / 2);

        // Reduce height so it doesn't overlap (adjust as needed)
        const maxH = 200;      // <- lowered from 240
        const innerTop = 200;  // <- top Y for the max-height area (was ~170)

        if (power > 0) {
            let h = map(power, 0, 100, 0, maxH);

            let c = lerpColor(color(255, 0, 0), color(255, 255, 0), power / 100);

            fill(c); noStroke();
            rect(innerX, innerTop + (maxH - h), innerW, h);
        }

        // Label (keeps centered over the inner bar)
        fill(255); textAlign(CENTER); textSize(12);
        text("POWER", innerX + innerW / 2, 140);
    }

    drawPhaseOverlays() {
        switch (this.currentPhase) {
            case this.phases.MENU:
                this.drawOverlay("PANIC BURGER", "PRESS SPACE TO START");
                break;
            case this.phases.INSTRUCTIONS:
                this.drawInstructionsOverlay();
                break;
            case this.phases.CALIBRATION:
                this.drawOverlay("CALIBRATION", "STAND UPRIGHT");
                this.squatDetector.drawSkeleton();
                break;
            case this.phases.GAMEOVER:
                this.drawOverlay("GAME OVER", `BURGERS: ${this.burgersCompleted}`);
                break;
            case this.phases.SQUATTING:
                this.drawSquattingOverlay();
                break;
        }
    }

    drawOverlay(title, sub) {
        // Use the same font as the loading text
        // (Google font is included in index.html)
        textFont('Press Start 2P');
        fill(0, 0, 0, 200);
        rect(0, 0, width, height);
        textAlign(CENTER);
        fill(255); textSize(40);
        text(title, width / 2, height / 2 - 20);
        textSize(20);
        text(sub, width / 2, height / 2 + 30);
        // Optional: reset if other UI should use default
        // textFont('sans-serif');
    }

    drawInstructionsOverlay() {
        textFont('Press Start 2P');
        fill(0, 0, 0, 200);
        rect(0, 0, width, height);
        textAlign(CENTER);
        
        fill(255, 255, 0); 
        textSize(48);
        text("HOW TO PLAY", width / 2, 60);
        
        fill(255);
        textSize(20);
        let y = 140;
        let lineHeight = 30;
        let sectionGap = 20;
        
        // Step 1
        text("1. SQUAT to fill the", width / 2, y);
        y += lineHeight;
        text("   POWER BAR", width / 2, y);
        y += lineHeight + sectionGap;
        
        // Step 2
        text("2. When FULL, assemble", width / 2, y);
        y += lineHeight;
        text("   the burger using the", width / 2, y);
        y += lineHeight;
        text("   BUTTONS to match the", width / 2, y);
        y += lineHeight;
        text("   order at the top", width / 2, y);
        y += lineHeight + sectionGap;
        
        // Step 3
        text("3. Complete orders before", width / 2, y);
        y += lineHeight;
        text("   time runs out!", width / 2, y);
        
        // // Countdown indicator
        // y = height - 80;
        // textSize(14);
        // fill(255, 255, 0);
        // text("Starting soon...", width / 2, y);
    }

    drawSquattingOverlay() {
        textFont('Press Start 2P');
        fill(255); 
        textAlign(CENTER, CENTER);
        textSize(60);
        text("SQUAT", width / 2, height / 2);
    }
}
