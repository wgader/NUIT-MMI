export default class SquatDetector {
    constructor() {
        this.video = null;
        this.bodyPose = null;
        this.poses = [];
        this.isReady = false;
        
        this.isCalibrated = false;
        this.standY = 0;
        this.squatThreshold = 25; 

        this.squatState = 'UP';
        this.power = 0;
        this.calibrationFrames = 0;
        this.calibrationSumY = 0;

        this.debugMsg = "Initializing...";
    }

    setup() {
        this.video = createCapture(VIDEO);
        this.video.size(640, 480);
        this.video.hide();

        try {
            this.bodyPose = ml5.bodyPose(this.video, () => {
                console.log("Model Ready");
                this.isReady = true;

                if (this.bodyPose && this.bodyPose.detectStart) {
                    this.bodyPose.detectStart(this.video, (results) => {
                        this.poses = results;
                    });
                }
            });
        } catch (e) {
            console.error("ML5 Init Error:", e);
        }
    }

    startCalibration() {
        this.isCalibrated = false;
        this.calibrationFrames = 0;
        this.calibrationSumY = 0;
        this.debugMsg = "CALIBRATING... STAND TALL";
        console.log("Starting calibration...");
    }

    resetPower() {
        this.power = 0;
    }

    update() {
        if (kb.presses('c')) this.startCalibration();

        if (kb.presses('s')) {
            this.addPower(20);
            this.playEffortSound();
            this.debugMsg = "MANUAL SQUAT (S key)";
            return;
        }

        if (!this.isReady || this.poses.length === 0) return;

        let pose = this.poses[0];

        let findPart = (n) => pose.keypoints.find(k => k.name === n || k.part === n);
        let leftHip = findPart('left_hip') || findPart('leftHip') || pose.keypoints[11];
        let rightHip = findPart('right_hip') || findPart('rightHip') || pose.keypoints[12];

        if (!leftHip || !rightHip) {
            this.debugMsg = "WAITING FOR HIPS...";
            return;
        }

        let currentY = (leftHip.y + rightHip.y) / 2;

        if (!this.isCalibrated) {
            if (this.calibrationFrames < 60) {
                this.calibrationSumY += currentY;
                this.calibrationFrames++;
            } else {
                this.standY = this.calibrationSumY / this.calibrationFrames;
                this.isCalibrated = true;
                this.debugMsg = "GO! SQUAT DOWN!";
            }
        } else {
            if (this.squatState === 'UP') {
                if (currentY > this.standY + this.squatThreshold) {
                    this.squatState = 'DOWN';
                    this.debugMsg = "GOOD! NOW UP!";
                } else {
                    let diff = (this.standY + this.squatThreshold) - currentY;
                    this.debugMsg = `GO LOWER: ${diff.toFixed(0)}px`;
                }
            } else if (this.squatState === 'DOWN') {
                if (currentY < this.standY + this.squatThreshold * 0.5) {
                    this.squatState = 'UP';
                    this.addPower(20);
                    this.playEffortSound();
                    this.debugMsg = "GREAT! +POWER";
                } else {
                    this.debugMsg = "STAND UP!";
                }
            }
        }
    }

    addPower(amount) {
        this.power = constrain(this.power + amount, 0, 100);
    }

    playEffortSound() {
        try {
            const sounds = window.assets && window.assets.effortSounds;
            if (!sounds || !sounds.length) return;
            const idx = Math.floor(Math.random() * sounds.length);
            const chosen = sounds[idx];
            if (chosen && typeof chosen.play === 'function') {
                chosen.setVolume(2.0);
                setTimeout(() => {
                    if (chosen && typeof chosen.play === 'function') {
                        try {
                            chosen.play();
                        } catch (e) {
                        }
                    }
                }, 0);
            }
        } catch (e) {
        }
    }

    draw() {
        push();
        translate(width, 0);
        scale(-1, 1);
        pop();

        this.drawSkeleton();
        this.drawLines();
        this.drawDebugText();
    }

    drawLines() {
        if (!this.isCalibrated) return;

        let standY_mapped = this.standY * (height / 480);
        let squatY_mapped = (this.standY + this.squatThreshold) * (height / 480);

        stroke(0, 255, 0);
        strokeWeight(2);
        line(0, standY_mapped, width, standY_mapped);

        stroke(255, 0, 0);
        strokeWeight(4);
        line(0, squatY_mapped, width, squatY_mapped);
    }

    drawSkeleton() {
        if (!this.poses.length) return;
        let pose = this.poses[0];
        let findPart = (n) => pose.keypoints.find(k => k.name === n || k.part === n);
        let leftHip = findPart('left_hip') || pose.keypoints[11];
        let rightHip = findPart('right_hip') || pose.keypoints[12];

        if (leftHip && rightHip) {
            fill(0, 255, 255);
            noStroke();
            let lx = width - leftHip.x * (width / 640);
            let ly = leftHip.y * (height / 480);
            let rx = width - rightHip.x * (width / 640);
            let ry = rightHip.y * (height / 480);

            ellipse(lx, ly, 20, 20);
            ellipse(rx, ry, 20, 20);
        }
    }

    drawDebugText() {
        push();
        fill(255);
        stroke(0);
        strokeWeight(3);
        textSize(24);
        textAlign(CENTER, TOP);
        text(this.debugMsg, width / 2, 10);

        textSize(14);
        textAlign(LEFT, BOTTOM);
        text("Press 'C' to Recalibrate", 10, height - 10);
        pop();
    }
}
