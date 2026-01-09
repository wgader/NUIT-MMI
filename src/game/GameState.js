import SquatDetector from './SquatDetector.js';
import BurgerBuilder from './BurgerBuilder.js';
import ParticleSystem from './ParticleSystem.js';
import Client from './Client.js';

export default class GameState {
    constructor() {
        this.phases = {
            MENU: 'MENU',
            INSTRUCTIONS: 'INSTRUCTIONS',
            CALIBRATION: 'CALIBRATION',
            SQUATTING: 'SQUATTING',
            ASSEMBLING: 'ASSEMBLING',
            GAMEOVER: 'GAMEOVER'
        };
        this.currentPhase = this.phases.MENU;
        this.score = 0;
        this.time = 15;
        this.instructionsTimer = 0; 
        this.burgersCompleted = 0;

        this.squatDetector = new SquatDetector();
        this.burgerBuilder = new BurgerBuilder();
        this.particles = new ParticleSystem();
        this.client = null;
        this.leavingClients = [];
        this.musicStarted = false;
        this.cookingSoundStarted = false;
    }

    resetRun() {
        this.score = 0;
        this.burgersCompleted = 0;
        this.time = 15;
        this.client = null;
        this.leavingClients = [];
        this.squatDetector.resetPower();
    }

    changePhase(newPhase) {
        this.currentPhase = newPhase;
        if (newPhase === this.phases.INSTRUCTIONS) {
            this.instructionsTimer = 0; 
        } else if (newPhase === this.phases.CALIBRATION) {
            this.squatDetector.startCalibration();
        } else if (newPhase === this.phases.SQUATTING) {
            this.squatDetector.resetPower();
            this.ensureActiveClient();
            this.stopCookingSound();
        } else if (newPhase === this.phases.ASSEMBLING) {
            this.burgerBuilder.newOrder();
            this.startCookingSound();
        } else if (newPhase === this.phases.GAMEOVER) {
            this.stopBackgroundMusic();
            this.stopCookingSound();
            this.playLoseSound();
        }
    }

    update() {
        if (this.client) this.client.update();
        this.leavingClients.forEach(c => c.update());
        this.leavingClients = this.leavingClients.filter(c => !c.hasLeft());
        this.particles.update();

        if (this.currentPhase === this.phases.ASSEMBLING || this.currentPhase === this.phases.SQUATTING) {
            if (frameCount % 60 === 0 && this.time > 0) {
                this.time--;
            }
            if (this.time <= 0) {
                this.stopBackgroundMusic();
                this.changePhase(this.phases.GAMEOVER);
            }
        }

        switch (this.currentPhase) {
            case this.phases.MENU:
                if (kb.presses('space')) {
                    this.resetRun();
                    this.playBackgroundMusic();
                    this.changePhase(this.phases.INSTRUCTIONS);
                }
                break;
            case this.phases.INSTRUCTIONS:
                this.instructionsTimer++;
                if (kb.presses('space')) {
                    this.playBackgroundMusic();
                    this.changePhase(this.phases.CALIBRATION);
                    break;
                }
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
                
                if (this.client && this.client.hasLeft()) {
                    this.changePhase(this.phases.GAMEOVER);
                    break;
                }
                
                if (this.burgerBuilder.orderComplete) {
                    this.playCompleteSound();
                    this.stopCookingSound();
                    this.sendCurrentClientAway();
                    this.spawnNextClient();
                    this.score += 100;
                    this.time += 10;
                    this.particles.emit(width / 2, height / 2, 'FIRE');
                    this.burgersCompleted++;
                    this.changePhase(this.phases.SQUATTING);
                }
                break;
            case this.phases.GAMEOVER:
                if (kb.presses('space')) {
                    this.resetRun();
                    this.playBackgroundMusic();
                    this.changePhase(this.phases.MENU);
                }
                break;
        }
    }

    ensureActiveClient() {
        if (!this.client) {
            this.spawnNextClient();
        }
    }

    spawnNextClient() {
        const incoming = new Client();
        incoming.reset();
        incoming.onAngry = () => this.playAngrySound();
        this.client = incoming;
    }

    sendCurrentClientAway() {
        if (!this.client) return;
        this.client.startLeaving();
        this.leavingClients.push(this.client);
        this.client = null;
    }

    playBackgroundMusic() {
        if (this.musicStarted) return;
        const bg = window.assets && window.assets.backgroundMusic;
        if (bg && typeof bg.play === 'function') {
            try {
                bg.setLoop(true);
                bg.setVolume(0.15);
                setTimeout(() => {
                    if (bg && typeof bg.play === 'function') {
                        try {
                            bg.play();
                            this.musicStarted = true;
                        } catch (e) {
                        }
                    }
                }, 0);
            } catch (e) {
            }
        }
    }

    stopBackgroundMusic() {
        const bg = window.assets && window.assets.backgroundMusic;
        if (bg && typeof bg.stop === 'function') {
            try {
                bg.stop();
            } catch (e) {
            }
        }
        this.musicStarted = false;
    }

    startCookingSound() {
        if (this.cookingSoundStarted) return;
        const cook = window.assets && window.assets.cookingSound;
        if (cook && typeof cook.play === 'function') {
            try {
                cook.setLoop(true);
                cook.setVolume(0.5);
                setTimeout(() => {
                    if (cook && typeof cook.play === 'function') {
                        try {
                            cook.play();
                            this.cookingSoundStarted = true;
                        } catch (e) {
                        }
                    }
                }, 0);
            } catch (e) {
            }
        }
    }

    stopCookingSound() {
        const cook = window.assets && window.assets.cookingSound;
        if (cook && typeof cook.stop === 'function') {
            try {
                cook.stop();
            } catch (e) {
            }
        }
        this.cookingSoundStarted = false;
    }

    playCompleteSound() {
        const complete = window.assets && window.assets.completeSound;
        if (complete && typeof complete.play === 'function') {
            try {
                complete.setVolume(2.0);
                setTimeout(() => {
                    if (complete && typeof complete.play === 'function') {
                        try {
                            complete.play();
                        } catch (e) {
                        }
                    }
                }, 0);
            } catch (e) {
            }
        }
    }

    playLoseSound() {
        const lose = window.assets && window.assets.loseSound;
        if (lose && typeof lose.play === 'function') {
            try {
                lose.setVolume(1.2);
                setTimeout(() => {
                    if (lose && typeof lose.play === 'function') {
                        try {
                            lose.play();
                        } catch (e) {
                        }
                    }
                }, 0);
            } catch (e) {
            }
        }
    }

    playAngrySound() {
        const angry = window.assets && window.assets.angrySound;
        if (angry && typeof angry.play === 'function') {
            try {
                angry.setVolume(1.2);
                setTimeout(() => {
                    if (angry && typeof angry.play === 'function') {
                        try {
                            angry.play();
                        } catch (e) {
                        }
                    }
                }, 0);
            } catch (e) {
            }
        }
    }

    draw() {
        background('#000233');

        if (window.assets && window.assets.bg) {
            image(window.assets.bg, 0, 0, width, height);
        }

        this.drawCityBg();

        this.drawChef();
        this.drawBigChef();

        this.drawFlamme();
        this.drawBarbecue();
        this.drawDesk();

        if (this.currentPhase === this.phases.SQUATTING || this.currentPhase === this.phases.ASSEMBLING) {
            this.drawClients();
        }

        this.drawLayout();
        this.drawIngFrame();

        if (this.currentPhase === this.phases.ASSEMBLING) {
            this.burgerBuilder.draw();
        }

        this.drawGaugeFill();
        this.particles.draw();

        this.drawPhaseOverlays();
    }

    drawClients() {
        this.leavingClients.forEach(c => c.draw());
        if (this.client) this.client.draw();
    }

    drawChef() {
        const gaugeX = 10;
        const gaugeY = 140;
        const gaugeW = 90;
        const gaugeH = 300;
        const chefW = 140;
        const chefH = 140;
        const padding = 10; 

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

    drawBigChef() {
        if (window.assets && window.assets.bigChef) {
            const chefW = 250;
            const chefH = 250;
            const x = width / 2 - chefW / 2 + 220;
            const y = height / 2 - chefH / 2 + 60; 
            image(window.assets.bigChef, x, y, chefW, chefH);
        }
    }

    drawLayout() {
        fill(0, 0, 0, 200); noStroke();
        rect(0, 0, width, 30);

        fill(255, 255, 0);
        textAlign(CENTER, CENTER);
        textSize(18);
        textStyle(BOLD);

        let m = Math.floor(this.time / 60);
        let s = this.time % 60;
        let timeStr = `${m}:${s < 10 ? '0' + s : s}`;

        text(`BURGERS: ${this.burgersCompleted}      TIME: ${timeStr}`, width / 2, 15);
        textStyle(NORMAL); 

        if (window.assets && window.assets.frame) {
            image(window.assets.frame, 10, 35, width - 20, 80);
        }

    }

    drawIngFrame() {
        if (window.assets && window.assets.ingFrame) {
            image(window.assets.ingFrame, 10, 35, width - 20, 80);
        }
    }

    drawGaugeFill() {

        let power = this.squatDetector.power;
        const frames = window.assets && window.assets.flameFrames;

        const gaugeX = 10;
        const gaugeY = 140;
        const gaugeW = 90;
        const gaugeH = 300;

        const flameW = 50;
        const flameH = 220;
        const flameX = gaugeX + Math.round((gaugeW - flameW) / 2);
        const flameBottom = gaugeY + gaugeH - 20; 
        const flameY = flameBottom - flameH;

        if (frames && frames.length && power >= 0) {
            let idx = Math.floor(map(power, 0, 100, 0, frames.length - 1));
            idx = constrain(idx, 0, frames.length - 1);
            image(frames[idx], flameX, flameY, flameW, flameH);
        }

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
        textFont('Press Start 2P');
        fill(0, 0, 0, 200);
        rect(0, 0, width, height);
        textAlign(CENTER);
        fill(255); textSize(40);
        text(title, width / 2, height / 2 - 20);
        textSize(20);
        text(sub, width / 2, height / 2 + 30);
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
        
        text("1. SQUAT to fill the", width / 2, y);
        y += lineHeight;
        text("   POWER BAR", width / 2, y);
        y += lineHeight + sectionGap;
        
        text("2. When FULL, assemble", width / 2, y);
        y += lineHeight;
        text("   the burger using the", width / 2, y);
        y += lineHeight;
        text("   BUTTONS to match the", width / 2, y);
        y += lineHeight;
        text("   order at the top", width / 2, y);
        y += lineHeight + sectionGap;
        
        text("3. Complete orders before", width / 2, y);
        y += lineHeight;
        text("   time runs out!", width / 2, y);
        
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

    drawCityBg() {
        if (window.assets && window.assets.cityBg) {
            const displayWidth = 1200; 
            const aspectRatio = window.assets.cityBg.height / window.assets.cityBg.width;
            const displayHeight = displayWidth * aspectRatio;
            
            const x = width - displayWidth - 40; 
            const y = height / 2 - displayHeight / 2 + 20;
            
            image(window.assets.cityBg, x, y, displayWidth, displayHeight);
        }
    }

    drawDesk() {
        if (window.assets && window.assets.desk) {
            const displayWidth = 400;
            const aspectRatio = window.assets.desk.height / window.assets.desk.width;
            const displayHeight = displayWidth * aspectRatio;
            
            const x = width / 2 ; 
            const y = height / 2 - displayHeight / 2 + 190; 
            
            image(window.assets.desk, x, y, displayWidth, displayHeight);
        }
    }

    drawBarbecue() {
        if (window.assets && window.assets.barbecue) {
            const displayWidth = 350;
            const aspectRatio = window.assets.barbecue.height / window.assets.barbecue.width;
            const displayHeight = displayWidth * aspectRatio;
            
            const x = width / 2 + 410; 
            const y = height / 2 - displayHeight / 2 + 120; 
            
            image(window.assets.barbecue, x, y, displayWidth, displayHeight);
        }
    }

    drawFlamme() {
        if (window.assets && window.assets.flamme) {
            const flameW = 150;
            const flameH = 200;
            const x = width / 2 - flameW / 2 + 550;
            const y = height / 2 - flameH / 2 + 100;
            
            const speedMultiplier = 8.0;
            const time = frameCount * (0.15 * speedMultiplier);
            
            for (let layer = 0; layer < 4; layer++) {
                const layerTime = time + layer * 0.3;

                const baseAngle = (layer - 1.5) * 0.25; 
                const swayAngle = sin(layerTime * 2.5) * 1.2;
                const wobbleAngle = cos(layerTime * 3.3) * 0.6; 
                const totalAngle = baseAngle + swayAngle + wobbleAngle;
                
                const layerAlpha = 255 * (1 - layer * 0.25);
                
                push();
                translate(x + flameW / 2, y + flameH / 2);
                rotate(totalAngle);
                
                tint(255, 255, 255, layerAlpha);
                imageMode(CENTER);
                image(window.assets.flamme, 0, 0, flameW, flameH);
                pop();
            }
            
            noTint();
        }
    }
}
