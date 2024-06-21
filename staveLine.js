
class staveLine {
    constructor(y, length, stiffness, radius) {
        this.yPos = y;
        this.length = length;
        this.stiffness = stiffness;
        this.radius = radius;
        this.prev = null;
    }

    createParticlesAndConstraints(particlesArray) {
        for (let x = 0; x < stringLength; x += increment) {
            let fixed = false;
            if (!this.prev || x == stringLength - increment) {
                fixed = true;
            }
            let p = new Particle(x, this.yPos, this.radius, fixed, mass);
            particlesArray.push(p);

            if (this.prev) {
                fixed = false;
                let options = {
                    bodyA: p.body,
                    bodyB: this.prev.body,
                    length: this.length,
                    stiffness: this.stiffness,
                };

                let constraint = Constraint.create(options);
                World.add(world, constraint);
            }
            this.prev = p;
        }
    }
}


