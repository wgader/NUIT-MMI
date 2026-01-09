
import './style.css';
import GameState from './game/GameState.js';

let gameState;

// Helper to remove backgrounds using Flood Fill
// This "peels" the background layer starting from corners, removing connected 
// checkerboard/key colors without touching inner details (like the chef's white hat).
function cleanImage(img) {
    img.loadPixels();
    const w = img.width;
    const h = img.height;
    if (w === 0 || h === 0) return;

    // Visited array to prevent loops
    const visited = new Uint8Array(w * h);

    // Queue for BFS: [x, y]
    const queue = [];

    // Seed points: Start from all 4 corners to catch background
    // (Assuming sprites don't touch all corners)
    const seeds = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];

    // Define "Background-ish" Logic
    // 1. Key Color (Top Left)
    let kR = img.pixels[0];
    let kG = img.pixels[1];
    let kB = img.pixels[2];

    function isBackground(idx, r, g, b) {
        // A. Match Key Color (Green/Black tolerance)
        if (dist(r, g, b, kR, kG, kB) < 50) return true;

        // B. Match AI Checkerboard (Greys & Whites)
        // Light Greys (200+) to Whites (255) that are neutral (r~=g~=b)
        if (r > 190 && g > 190 && b > 190) {
            if (Math.abs(r - g) < 15 && Math.abs(g - b) < 15) return true;
        }

        return false;
    }

    // Initialize Seeds
    for (let s of seeds) {
        let x = s[0]; let y = s[1];
        let idx = (y * w + x) * 4;
        let r = img.pixels[idx];
        let g = img.pixels[idx + 1];
        let b = img.pixels[idx + 2];

        if (isBackground(idx, r, g, b)) {
            queue.push([x, y]);
            visited[y * w + x] = 1;
        }
    }

    // BFS
    while (queue.length > 0) {
        const [cx, cy] = queue.shift();
        const idx = (cy * w + cx) * 4;

        // Clear Pixel
        img.pixels[idx + 3] = 0; // Alpha 0

        // Check Neighbors (Up, Down, Left, Right)
        const neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];

        for (let n of neighbors) {
            let nx = n[0];
            let ny = n[1];

            // Bounds check
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                let nPos = ny * w + nx;
                if (visited[nPos] === 0) {
                    let nIdx = nPos * 4;
                    let nr = img.pixels[nIdx];
                    let ng = img.pixels[nIdx + 1];
                    let nb = img.pixels[nIdx + 2];

                    if (isBackground(nIdx, nr, ng, nb)) {
                        visited[nPos] = 1;
                        queue.push([nx, ny]);
                    }
                }
            }
        }
    }
    img.updatePixels();
}

window.preload = function () {
    window.assets = {};

    // Ingredients
    window.assets.ingredients = loadImage('assets/ingredients.png', cleanImage);

    //ingredients frame
    window.assets.ingFrame = loadImage('assets/frame.png', cleanImage);

    // CHEF: Load the separate files as requested
    window.assets.chefDebout = loadImage('assets/chef-debout.png', cleanImage);
    window.assets.chefSquat = loadImage('assets/chef-squat.png', cleanImage);

    // Fallback/Legacy
    window.assets.chef = loadImage('assets/chef_sheet.png', cleanImage);
    window.assets.chefGym = loadImage('assets/chef_gym.png', cleanImage);

    // Background (Opaque)
    window.assets.cityBg = loadImage('assets/city.png', cleanImage);

    // Characters
    window.assets.client = loadImage('assets/client.png', cleanImage);
    window.assets.clientAngry = loadImage('assets/client-angry.png', cleanImage);

    //Big chef
    window.assets.bigChef = loadImage('assets/chef.png', cleanImage);

    // UI - These often have the bad backgrounds
    window.assets.frame = loadImage('assets/blue_frame.png', cleanImage);
    window.assets.gauge = loadImage('assets/flame_gauge.png', cleanImage);
    window.assets.flameFrames = [
        loadImage('assets/flame/flame-1.png', cleanImage),
        loadImage('assets/flame/flame-2.png', cleanImage),
        loadImage('assets/flame/flame-3.png', cleanImage),
        loadImage('assets/flame/flame-4.png', cleanImage),
        loadImage('assets/flame/flame-5.png', cleanImage)
    ];
    window.assets.buttons = loadImage('assets/buttons.png', cleanImage);
}

window.setup = function () {
    let cvs = createCanvas(windowWidth, windowHeight);
    cvs.parent('app');

    noSmooth();

    gameState = new GameState();
    gameState.squatDetector.setup();

    console.log("Setup complete. Assets loaded.");
}

window.draw = function () {
    if (!gameState) return;
    gameState.update();
    gameState.draw();
}
