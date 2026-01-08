class GameState {
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
        this.timer = 0;

        // Managers
        this.squatDetector = new SquatDetector();
        this.burgerBuilder = new BurgerBuilder();
    }

    changePhase(newPhase) {
        console.log(`Changing phase from ${this.currentPhase} to ${newPhase}`);
        this.currentPhase = newPhase;

        // Initialize phase logic
        if (newPhase === this.phases.CALIBRATION) {
            this.squatDetector.startCalibration();
        } else if (newPhase === this.phases.SQUATTING) {
            this.squatDetector.resetPower();
        } else if (newPhase === this.phases.ASSEMBLING) {
            this.burgerBuilder.newOrder();
        }
    }

    update() {
        switch (this.currentPhase) {
            case this.phases.MENU:
                if (kb.presses('space')) {
                    this.changePhase(this.phases.CALIBRATION);
                }
                break;

            case this.phases.CALIBRATION:
                this.squatDetector.update();
                if (this.squatDetector.isCalibrated) {
                    this.changePhase(this.phases.SQUATTING);
                }
                break;

            case this.phases.SQUATTING:
                this.squatDetector.update();
                if (this.squatDetector.power >= 100) {
                    this.changePhase(this.phases.ASSEMBLING);
                }
                break;

            case this.phases.ASSEMBLING:
                this.burgerBuilder.update();
                if (this.burgerBuilder.orderComplete) {
                    this.score += 100; // Arbitrary score
                    this.changePhase(this.phases.SQUATTING);
                }
                break;

            case this.phases.GAMEOVER:
                if (kb.presses('space')) {
                    this.score = 0;
                    this.changePhase(this.phases.MENU);
                }
                break;
        }
    }

    draw() {
        // Draw Background
        // image(assets.background, 0, 0, width, height);
        background(30); // Fallback

        // Draw HUD
        this.drawHUD();

        // Phase specific drawing
        switch (this.currentPhase) {
            case this.phases.MENU:
                textAlign(CENTER);
                textSize(40);
                fill(255);
                text("PANIC BURGER", width / 2, height / 2 - 50);
                textSize(20);
                text("PRESS SPACE TO START", width / 2, height / 2 + 50);
                break;

            case this.phases.CALIBRATION:
                textAlign(CENTER);
                textSize(30);
                text("STAND STILL FOR CALIBRATION", width / 2, height / 2);
                break;

            case this.phases.SQUATTING:
                this.squatDetector.draw();
                break;

            case this.phases.ASSEMBLING:
                this.burgerBuilder.draw();
                break;

            case this.phases.GAMEOVER:
                textAlign(CENTER);
                textSize(40);
                fill(255, 0, 0);
                text("GAME OVER", width / 2, height / 2);
                textSize(20);
                fill(255);
                text("Score: " + this.score, width / 2, height / 2 + 60);
                text("PRESS SPACE TO RESTART", width / 2, height / 2 + 100);
                break;
        }
    }

    drawHUD() {
        fill(255);
        textSize(20);
        textAlign(LEFT, TOP);
        text("Score: " + this.score, 20, 20);

        // Debug phase
        textAlign(RIGHT, TOP);
        text(this.currentPhase, width - 20, 20);
    }
}
