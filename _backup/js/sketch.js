let gameState;

function preload() {
    preloadAssets();
}

function setup() {
    let cvs = createCanvas(800, 600);
    cvs.parent('game-container');

    // Pixel art settings
    noSmooth();

    // Initialize Game State
    gameState = new GameState();

    // Setup inputs
    setupInputs();

    // Setup PoseNet
    gameState.squatDetector.setup();
}

function draw() {
    gameState.update();
    gameState.draw();
}

function windowResized() {
    // centerCanvas();
}
