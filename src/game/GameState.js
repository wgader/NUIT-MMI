import SquatDetector from './SquatDetector.js';
import BurgerBuilder from './BurgerBuilder.js';
import ParticleSystem from './ParticleSystem.js';
import Animator from './Animator.js';
import Client from './Client.js';

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
        this.time = 30;
        this.instructionsTimer = 0; // NEW: tracks frames for auto-advance
        this.burgersCompleted = 0;

        // Managers
        this.squatDetector = new SquatDetector();
        this.burgerBuilder = new BurgerBuilder();
        this.particles = new ParticleSystem();
        this.client = new Client();
    }

    changePhase(newPhase) {
        this.currentPhase = newPhase;
        if (newPhase === this.phases.INSTRUCTIONS) {
            this.instructionsTimer = 0; // Reset timer
        } else if (newPhase === this.phases.CALIBRATION) {
            this.squatDetector.startCalibration();
        } else if (newPhase === this.phases.SQUATTING) {
            this.squatDetector.resetPower();
            this.client.reset();
        } else if (newPhase === this.phases.ASSEMBLING) {
            this.burgerBuilder.newOrder();
            this.client.reset();
        }
    }

    update() {
        this.client.update();
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
                if (kb.presses('space')) {
                    this.changePhase(this.phases.CALIBRATION);
                    break;
                }
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
                
                // Check if client left angry (timeout game over)
                if (this.client.hasLeft()) {
                    this.currentPhase = this.phases.GAMEOVER;
                    break;
                }
                
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
                    this.tlient.reset();
                    this.cime = 60;
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

        // --- 2. Client (Customer) ---
        // Only show during assembly phase (after squatting)
        if (this.currentPhase === this.phases.ASSEMBLING) {
            this.client.draw();
        }

        // --- 3. Chef ---
        this.drawChef();

        // --- 4
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
        // Draw flame sprites based on power instead of a color rect

        let power = this.squatDetector.power;
        const frames = window.assets && window.assets.flameFrames;

        const gaugeX = 10;
        const gaugeY = 140;
        const gaugeW = 90;
        const gaugeH = 300;

        // Size/placement for the flame inside the gauge
        const flameW = 50;
        const flameH = 220;
        const flameX = gaugeX + Math.round((gaugeW - flameW) / 2);
        const flameBottom = gaugeY + gaugeH - 20; // leave small padding at bottom
        const flameY = flameBottom - flameH;

        if (frames && frames.length && power >= 0) {
            // Map low power to frame 0 (flame-1), high power to last frame
            let idx = Math.floor(map(power, 0, 100, 0, frames.length - 1));
            idx = constrain(idx, 0, frames.length - 1);
            image(frames[idx], flameX, flameY, flameW, flameH);
        }

        // Label (keeps centered over the inner bar)
        fill(255); textAlign(CENTER); textSize(12);
        text("POWER", gaugeX + gaugeW / 2, 140);
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
                this.drawGameOverOverlay();
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
        
        // Prompt to skip
        y = height - 70;
        textSize(18);
        fill(255, 255, 0);
        text("PRESS SPACE TO START", width / 2, y);
    }

    drawSquattingOverlay() {
        textFont('Press Start 2P');
        fill(255); 
        textAlign(CENTER, CENTER);
        textSize(60);
        text("SQUAT", width / 2, height / 2);
    }

    drawGameOverOverlay() {
        textFont('Press Start 2P');
        fill(0, 0, 0, 200);
        rect(0, 0, width, height);
        textAlign(CENTER);

        fill(255);
        textSize(40);
        text("GAME OVER", width / 2, height / 2 - 60);

        fill(255, 255, 0);
        textSize(28);
        text(`BURGERS: ${this.burgersCompleted}`, width / 2, height / 2 - 20);

        fill(255);
        textSize(18);
        text("PRESS SPACE TO PLAY AGAIN", width / 2, height / 2 + 40);
    }
}
