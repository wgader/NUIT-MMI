class SquatDetector {
    constructor() {
        this.video = null;
        this.poseNet = null;
        this.poses = [];
        this.isReady = false;

        // Calibration
        this.isCalibrated = false;
        this.standY = 0; // Reference "standing" hip Y position
        this.squatThreshold = 50; // Pixels to drop to count as squat (adjustable)

        // State
        this.squatState = 'UP'; // 'UP', 'DOWN'
        this.power = 0; // 0 to 100
        this.calibrationFrames = 0;
        this.calibrationSumY = 0;
    }

    setup() {
        this.video = createCapture(VIDEO);
        this.video.size(640, 480);
        this.video.hide();

        this.poseNet = ml5.poseNet(this.video, () => {
            console.log("PoseNet Ready");
            this.isReady = true;
        });

        this.poseNet.on('pose', (results) => {
            this.poses = results;
        });
    }

    startCalibration() {
        this.isCalibrated = false;
        this.calibrationFrames = 0;
        this.calibrationSumY = 0;
        console.log("Starting calibration...");
    }

    resetPower() {
        this.power = 0;
    }

    update() {
        if (!this.isReady || this.poses.length === 0) return;

        let pose = this.poses[0].pose;
        // Average hip Y
        let leftHip = pose.keypoints.find(k => k.part === 'leftHip');
        let rightHip = pose.keypoints.find(k => k.part === 'rightHip');

        if (!leftHip || !rightHip) return;

        let currentY = (leftHip.position.y + rightHip.position.y) / 2;

        if (!this.isCalibrated) {
            // Calibrate logic: accumulate average over some frames
            if (this.calibrationFrames < 60) { // 1 sec @ 60fps
                this.calibrationSumY += currentY;
                this.calibrationFrames++;
            } else {
                this.standY = this.calibrationSumY / this.calibrationFrames;
                this.isCalibrated = true;
                console.log("Calibrated Stand Y:", this.standY);
            }
        } else {
            // Detection Logic
            if (this.squatState === 'UP') {
                if (currentY > this.standY + this.squatThreshold) {
                    this.squatState = 'DOWN';
                }
            } else if (this.squatState === 'DOWN') {
                if (currentY < this.standY + this.squatThreshold * 0.5) {
                    this.squatState = 'UP';
                    this.addPower(10); // Squat complete
                    // Play sound
                }
            }
        }
    }

    addPower(amount) {
        this.power = constrain(this.power + amount, 0, 100);
        console.log("Power:", this.power);
    }

    // Returns if we are in Phase A completion
    isFullPower() {
        return this.power >= 100;
    }

    draw() {
        push();
        // Flip video
        translate(width, 0);
        scale(-1, 1);
        if (this.video) image(this.video, 0, 0, width, height);
        pop();

        // Draw Skeleton debug
        this.drawSkeleton();

        // Draw Gauge overlay (not flipped)
        this.drawGauge();
    }

    drawSkeleton() {
        if (!this.poses.length) return;
        let pose = this.poses[0].pose;
        for (let keypoint of pose.keypoints) {
            if (keypoint.score > 0.2) {
                // Adjust x because of flip
                let x = width - keypoint.position.x * (width / 640);
                let y = keypoint.position.y * (height / 480);
                fill(0, 255, 0);
                noStroke();
                ellipse(x, y, 10, 10);
            }
        }
    }

    drawGauge() {
        // Draw Power Gauge on left
        fill(50);
        rect(20, height - 220, 30, 200);

        let barHeight = map(this.power, 0, 100, 0, 200);
        // Color gradient
        if (this.power < 50) fill(255, 255, 0);
        else if (this.power < 80) fill(255, 165, 0);
        else fill(255, 0, 0);

        rect(20, height - 20 - barHeight, 30, barHeight);

        stroke(255);
        noFill();
        rect(20, height - 220, 30, 200);
    }
}
