class Snowflake {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = -10;
        this.size = Math.random() * 3 + 2;
        this.speed = Math.random() * 1 + 0.5;
        this.wind = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.3 + 0.5;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
    }

    update(snowdrifts) {
        this.y += this.speed;
        this.x += this.wind;
        this.rotation += this.rotationSpeed;

        // Check if snowflake is out of bounds
        if (this.x < 0) this.x = this.canvas.width;
        if (this.x > this.canvas.width) this.x = 0;

        // Check for collision with snowdrifts
        for (let drift of snowdrifts) {
            if (Math.abs(this.x - drift.x) < this.size + drift.size &&
                Math.abs(this.y - drift.y) < this.size + drift.size) {
                snowdrifts.push({
                    x: this.x,
                    y: this.y,
                    size: this.size
                });
                this.reset();
                return;
            }
        }

        // Check if snowflake reached bottom
        if (this.y > this.canvas.height - this.size) {
            snowdrifts.push({
                x: this.x,
                y: this.canvas.height - this.size,
                size: this.size
            });
            this.reset();
        }
    }

    draw() {
        this.ctx.save();
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(this.rotation);
        this.ctx.beginPath();
        
        // Draw a star-shaped snowflake
        for (let i = 0; i < 6; i++) {
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(0, this.size);
            this.ctx.rotate(Math.PI / 3);
        }
        
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity})`;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        this.ctx.restore();
    }
}

class SnowEffect {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '1';
        document.body.appendChild(this.canvas);

        this.snowflakes = [];
        this.snowdrifts = [];
        this.maxSnowflakes = 100;
        this.maxSnowdrifts = 500;

        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Check if it's winter month (December, January, or February)
        const currentMonth = new Date().getMonth();
        if (currentMonth === 11 || currentMonth === 0 || currentMonth === 1) {
            this.initialize();
            this.animate();
        }
    }

    initialize() {
        // Create snowflakes gradually
        let count = 0;
        const interval = setInterval(() => {
            if (count < this.maxSnowflakes) {
                this.snowflakes.push(new Snowflake(this.canvas, this.ctx));
                count++;
            } else {
                clearInterval(interval);
            }
        }, 50);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw snowdrifts
        for (let drift of this.snowdrifts) {
            this.ctx.beginPath();
            this.ctx.arc(drift.x, drift.y, drift.size, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fill();
        }

        // Update and draw snowflakes
        for (let snowflake of this.snowflakes) {
            snowflake.update(this.snowdrifts);
            snowflake.draw();
        }

        // Limit number of snowdrifts
        if (this.snowdrifts.length > this.maxSnowdrifts) {
            this.snowdrifts = this.snowdrifts.slice(-this.maxSnowdrifts);
        }

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize snow effect
new SnowEffect(); 