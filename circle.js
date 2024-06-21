class Particle{
    constructor(x, y, r, fixed, mass) {
        this.x = x;
        this.y = y;
        this.r = 2;
        this.mass = mass;
        let options = {
            friction: 0.7,
            restitution: 0.9,
            isStatic: fixed,
            //frictionAir: 0.1
        }
        
        this.body = Bodies.circle(this.x, this.y, this.r,  options);
      //console.log("Creating particle with mass:", this.mass);
        //Body.setDensity(this.body, this.mass);
        Composite.add(world, this.body);
    }

    show() {
        let pos = this.body.position;
        let angle = this.body.angle;
        push();
        translate(pos.x, pos.y);
        rotate(angle);
        rectMode(CENTER);
        strokeWeight(1);
        stroke(255)
        fill(127);
        //ellipse(0, 0, this.r*2);
        //line(0,0,this.r,0);
        pop();
    }
}