export default class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    // Type: 'FIRE', 'SMOKE'
    emit(x, y, type) {
        let p = {
            x: x,
            y: y,
            vx: random(-1, 1),
            vy: random(-2, -0.5),
            life: 255,
            type: type
        };
        this.particles.push(p);
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 5;

            if (p.type === 'FIRE') {
                p.vy *= 0.95; // Slow down
                p.life -= 8; // Die faster
            }

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw() {
        noStroke();
        for (let p of this.particles) {
            if (p.type === 'FIRE') {
                fill(255, random(100, 200), 0, p.life);
                rect(p.x, p.y, random(4, 8), random(4, 8)); // Pixel fire
            } else if (p.type === 'SMOKE') {
                fill(100, 100, 100, p.life);
                rect(p.x, p.y, random(6, 12), random(6, 12));
            }
        }
    }
}
