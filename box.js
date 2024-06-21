class Box {
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = 12; // Radius used in the constructor
        this.fade = 255; // Initialize opacity
        this.fadeStartY = 350; // Set the y position after which fade begins
        let options = {
            friction: 0.1,
            frictionAir: 0.1, // Air friction
            restitution: 0.9,
            mass: 1, // Start with a base mass
        };
        this.body = Bodies.circle(this.x, this.y, this.r, options);
        Composite.add(world, this.body);

        // Initialize with a random angular velocity
        this.rotationDirection = random() < 0.5 ? -1 : 1; // -1 for anticlockwise, 1 for clockwise
        this.initialTorque = random(0.02, 0.05) * this.rotationDirection;
        Body.setAngularVelocity(this.body, this.initialTorque);

        this.creationTime = millis(); // Store the creation time
        this.mass = 0.3; // Initial mass
        this.setMass(this.mass);
    }

    setFriction(frictionAir) {
        this.frictionAir = frictionAir;
        Body.set(this.body, 'frictionAir', this.frictionAir);
    }

    setMass(mass) {
        this.mass = mass;
        Body.set(this.body, 'mass', this.mass);
    }

    fadeOut() {
        if (this.body.position.y > this.fadeStartY) {
            this.fade -= 10;
        }
    }

    updateMass() {
        // Calculate the age of the box in seconds
        let ageInSeconds = (millis() - this.creationTime) / 1000;

        // Define how the mass should increase with age
        let newMass = 0.3 + ageInSeconds * 0.01; // Example: mass increases by 0.001 every second

        // Constrain the new mass to avoid it becoming too large
        newMass = constrain(newMass, 0.3, 0.9);

        // Update the box's mass if it has changed
        if (newMass !== this.mass) {
            this.setMass(newMass);
        }
    }
  
      updateTorque(wind) {
        // Adjust torque based on wind's x component
        let torqueAmount = wind.x * 200; // Scale factor for demonstration
        let currentAngularVelocity = this.body.angularVelocity;
        
        // Check if angular velocity is below a certain threshold
        if (Math.abs(currentAngularVelocity) < 0.10) {
            // If below threshold, randomly choose a new direction
            this.rotationDirection = random() < 0.5 ? -1 : 1;
            torqueAmount *= this.rotationDirection;
        }
        
        Body.setAngularVelocity(this.body, currentAngularVelocity + torqueAmount);
    }

    show() {
        let pos = this.body.position;
        let angle = this.body.angle;
        push();
        translate(pos.x, pos.y);
        rotate(angle);
        rectMode(CENTER);
        strokeWeight(1);
        stroke(0, this.fade);
        fill(0, this.fade);
        ellipse(0, 0, this.r * 1.5, this.r * 2.0); // Drawing as an ellipse for visual effect
        pop();
    }
}
