export default class BurgerBuilder {
    constructor() {
        this.currentOrder = [];
        this.playerStack = [];
        this.orderComplete = false;
        // Map ingredients to sprite sheet indices
        this.ingMap = { 'TOMATO': 5, 'LETTUCE': 4, 'CHEESE': 3, 'PATTY': 2 };
        this.ingredients = ['TOMATO', 'LETTUCE', 'CHEESE', 'PATTY'];
        // Visual vertical offsets to compensate sprite baseline differences
        this.ingYOffset = { 'TOMATO': 0, 'LETTUCE': 0, 'CHEESE': 0, 'PATTY': -12 };
    }

    newOrder() {
        this.currentOrder = [];
        this.playerStack = [];
        this.orderComplete = false;

        let count = Math.floor(random(3, 6));
        for (let i = 0; i < count; i++) {
            this.currentOrder.push(random(this.ingredients));
        }
    }

    update() {
        if (kb.presses('left')) this.addIngredient('TOMATO');
        if (kb.presses('up')) this.addIngredient('LETTUCE');
        if (kb.presses('down')) this.addIngredient('CHEESE');
        if (kb.presses('right')) this.addIngredient('PATTY');
    }

    addIngredient(ing) {
        if (this.orderComplete) return;

        let expected = this.currentOrder[this.playerStack.length];

        if (ing === expected) {
            this.playerStack.push(ing);
            if (this.playerStack.length === this.currentOrder.length) {
                this.orderComplete = true;
            }
        } else {
            // Mistake: Reset stack
            this.playerStack = [];
        }
    }

    draw() {
        // --- 1. Draw Target Order (INSIDE TOP FRAME) ---
        // Frame is at 10,10, size w-20, 80.
        // Center text and icons there.

        let totalWidth = width - 100; // leave margins on sides
        let spacing = totalWidth / (this.currentOrder.length + 1);
        let startX = spacing;

        for (let i = 0; i < this.currentOrder.length; i++) {
            let ing = this.currentOrder[i];
            let idx = this.ingMap[ing];
            let x = startX + i * spacing;
            let y = 55 + (this.ingYOffset[ing] || 0); // Adjust per-ingredient to visually align
            // Frame y=35 to 115. Center is 75. Sprite is 40x40. 
            // So y=55 puts it from 55 to 95. Perfect.

            // Draw Sprite (use 40x40 to match layout)
            if (window.assets && window.assets.ingredients) {
                let sW = window.assets.ingredients.width / 3;
                let sH = window.assets.ingredients.height / 2;
                let col = idx % 3;
                let row = Math.floor(idx / 3);
                image(window.assets.ingredients, x - 20, y - 20, 80, 80, col * sW, row * sH, sW, sH);
            }

            // Checkmark
            if (i < this.playerStack.length) {
                fill(0, 255, 0); textSize(30); stroke(0); strokeWeight(3);
                text("✔", x + 10, y + 30);
            }
        }

        // --- 2. Player Stack (Center Bottom Counter) ---
        let stackBaseY = height - 120;

        if (window.assets && window.assets.ingredients) {
            let sW = window.assets.ingredients.width / 3;
            let sH = window.assets.ingredients.height / 2;

            // Base Bun
            image(window.assets.ingredients, width / 2 - 40, stackBaseY, 80, 40, 1 * sW, 0, sW, sH);

            let y = stackBaseY - 15;
            for (let item of this.playerStack) {
                let idx = this.ingMap[item];
                let col = idx % 3;
                let row = Math.floor(idx / 3);
                image(window.assets.ingredients, width / 2 - 35, y, 70, 35, col * sW, row * sH, sW, sH);
                y -= 25;
            }
            if (this.orderComplete) image(window.assets.ingredients, width / 2 - 40, y - 10, 80, 40, 0, 0, sW, sH);
        }

        this.drawControls();
    }

    drawControls() {
        // 4 Big Buttons at Bottom
        let y = height - 50;
        let spacing = 100;
        let startX = width / 2 - 1.5 * spacing;

        let buttons = [
            { key: '<', ing: 'TOMATO', color: '#ff4444' }, // Red
            { key: '^', ing: 'LETTUCE', color: '#44ff44' }, // Green
            { key: 'v', ing: 'CHEESE', color: '#ffff44' }, // Yellow
            { key: '>', ing: 'PATTY', color: '#8b4513' }  // Brown
        ];

        buttons.forEach((b, i) => {
            let x = startX + i * spacing;

            // Big Circle
            fill(b.color); stroke(255); strokeWeight(4);
            ellipse(x, y, 70, 70);

            // Icon Inside (apply per-ingredient Y offset, moved slightly lower)
            if (window.assets && window.assets.ingredients) {
                let idx = this.ingMap[b.ing];
                let sW = window.assets.ingredients.width / 3;
                let sH = window.assets.ingredients.height / 2;
                let col = idx % 3;
                let row = Math.floor(idx / 3);
                let iconYOffset = this.ingYOffset[b.ing] || 0;
                let buttonOffset = (b.ing === 'PATTY') ? -24 : 0; // negative to pull up
                image(
                    window.assets.ingredients,
                    x - 25,
                    y - 25 + iconYOffset + 16 + buttonOffset,
                    50,
                    50,
                    col * sW,
                    row * sH,
                    sW,
                    sH
                );
            }
        });

        fill(255); noStroke(); textAlign(CENTER); textSize(16);
        text("HIT THE BUTTONS TO ASSEMBLE THE BURGER", width / 2, height - 100);
    }
}
