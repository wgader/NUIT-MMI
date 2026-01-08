let assets = {
    ingredients: null,
    chef: null,
    background: null,
    sounds: {}
};

function preloadAssets() {
    // We assume the images are in assets/
    // Since we have sprite sheets/images, we load them here.

    // Fallback handling to avoid crashing if files missing
    try {
        assets.ingredients = loadImage('assets/ingredients.png');
        assets.chef = loadImage('assets/chef_idle.png');
        assets.background = loadImage('assets/background.png');
    } catch (e) {
        console.error("Error loading assets:", e);
    }
}
