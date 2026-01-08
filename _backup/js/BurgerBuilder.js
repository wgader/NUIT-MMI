class BurgerBuilder {
    constructor() {
        this.currentOrder = [];
        this.playerStack = [];
        this.orderComplete = false;

        // Mappings
        // 0: Tomato, 1: Lettuce, 2: Cheese, 3: Patty
        this.ingredients = ['TOMATO', 'LETTUCE', 'CHEESE', 'PATTY'];
    }

    newOrder() {
        this.currentOrder = [];
        this.playerStack = [];
        this.orderComplete = false;

        // Generate random order of 3-5 items
        let count = Math.floor(random(3, 6));
        for (let i = 0; i < count; i++) {
            let item = random(this.ingredients);
            this.currentOrder.push(item);
        }
        console.log("New Order:", this.currentOrder);
    }

    update() {
        if (kb.presses('left')) this.addIngredient('TOMATO');
        if (kb.presses('up')) this.addIngredient('LETTUCE');
        if (kb.presses('down')) this.addIngredient('CHEESE');
        if (kb.presses('right')) this.addIngredient('PATTY');
    }

    addIngredient(ing) {
        let expected = this.currentOrder[this.playerStack.length];

        if (ing === expected) {
            this.playerStack.push(ing);
            // Play success sound
            if (this.playerStack.length === this.currentOrder.length) {
                this.orderComplete = true;
                // Play finish sound
            }
        } else {
            // Mistake!
            // Punishment: Reset stack or Time penalty? 
            // Specs say: "Buzzer, player loses time or restarts assembly".
            // Let's reset stack for now.
            this.playerStack = [];
            // Play error sound
            console.log("Wrong ingredient! Resetting.");
        }
    }

    draw() {
        // Draw Order at, say, top of screen
        textAlign(CENTER);
        fill(255);
        text("ASSEMBLE THIS!", width / 2, 50);

        let startX = width / 2 - (this.currentOrder.length * 40) / 2;
        for (let i = 0; i < this.currentOrder.length; i++) {
            let ing = this.currentOrder[i];
            fill(this.getColor(ing));
            rect(startX + i * 40, 70, 30, 30);

            // Draw checkmark if completed
            if (i < this.playerStack.length) {
                fill(0, 255, 0);
                text("v", startX + i * 40 + 15, 60);
            }
        }

        // Draw Player's current burger stack in center (growing upwards)
        let stackBaseY = height - 100;

        // Bottom Bun
        fill(200, 150, 50);
        rect(width / 2 - 50, stackBaseY, 100, 20); // Bun Bottom

        let y = stackBaseY - 20;
        for (let item of this.playerStack) {
            fill(this.getColor(item));
            rect(width / 2 - 45, y, 90, 15);
            y -= 15;
        }

        // Key hints
        this.drawHints();
    }

    getColor(ing) {
        switch (ing) {
            case 'TOMATO': return color(255, 0, 0);
            case 'LETTUCE': return color(0, 255, 0);
            case 'CHEESE': return color(255, 255, 0);
            case 'PATTY': return color(139, 69, 19);
            default: return color(255);
        }
    }

    drawHints() {
        // HUD Bas: Visual reminder of keys
        let y = height - 50;
        textAlign(CENTER);
        textSize(10);

        fill(255, 0, 0); ellipse(width / 2 - 100, y, 30); fill(0); text("<-", width / 2 - 100, y + 4); // Left
        fill(0, 255, 0); ellipse(width / 2 - 40, y, 30); fill(0); text("^", width / 2 - 40, y + 4); // Up
        fill(255, 255, 0); ellipse(width / 2 + 40, y, 30); fill(0); text("v", width / 2 + 40, y + 4); // Down
        fill(139, 69, 19); ellipse(width / 2 + 100, y, 30); fill(255); text("->", width / 2 + 100, y + 4); // Right
    }
}
