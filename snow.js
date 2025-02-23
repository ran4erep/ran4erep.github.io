class SnowAnimation {
    constructor() {
        this.bgCanvas = document.createElement('canvas');
        this.bgCanvas.id = 'snow-canvas-bg';
        this.bgCanvas.className = 'snow-canvas background';
        document.body.appendChild(this.bgCanvas);
        this.bgCtx = this.bgCanvas.getContext('2d');
        
        this.fgCanvas = document.createElement('canvas');
        this.fgCanvas.id = 'snow-canvas-fg';
        this.fgCanvas.className = 'snow-canvas foreground';
        document.body.appendChild(this.fgCanvas);
        this.fgCtx = this.fgCanvas.getContext('2d');
        
        this.particles = [];
        this.particleCount = 50;
        this.isSnowing = localStorage.getItem('isSnowing') !== 'false';
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.createParticles();
        this.setupToggleButton();
        
        if (!this.isSnowing) {
            this.hideSnow();
        }
        
        this.animate();
    }
    
    setupToggleButton() {
        const toggleButton = document.getElementById('snow-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                this.isSnowing = !this.isSnowing;
                localStorage.setItem('isSnowing', this.isSnowing);
                
                if (this.isSnowing) {
                    this.showSnow();
                } else {
                    this.hideSnow();
                }
            });
        }
    }
    
    showSnow() {
        this.bgCanvas.style.display = 'block';
        this.fgCanvas.style.display = 'block';
    }
    
    hideSnow() {
        this.bgCanvas.style.display = 'none';
        this.fgCanvas.style.display = 'none';
    }
    
    resize() {
        this.bgCanvas.width = window.innerWidth;
        this.bgCanvas.height = window.innerHeight;
        this.fgCanvas.width = window.innerWidth;
        this.fgCanvas.height = window.innerHeight;
    }
    
    createParticles() {
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.bgCanvas.width,
                y: Math.random() * this.bgCanvas.height,
                radius: Math.random() * 3 + 1,
                speed: Math.random() * 1 + 0.5,
                angle: Math.random() * Math.PI * 2,
                swing: Math.random() * 0.05 + 0.1,
                swingCount: Math.random() * Math.PI * 2,
                isForeground: Math.random() < 0.3,
                opacity: Math.random() * 0.5 + 0.3
            });
        }
    }
    
    moveParticle(particle) {
        particle.swingCount += particle.swing;
        particle.x += Math.sin(particle.swingCount) * 0.5;
        particle.y += particle.speed * (particle.isForeground ? 1.5 : 1);
        
        if (particle.y > this.bgCanvas.height) {
            particle.y = -5;
            particle.x = Math.random() * this.bgCanvas.width;
        }
        if (particle.x > this.bgCanvas.width) {
            particle.x = 0;
        }
        if (particle.x < 0) {
            particle.x = this.bgCanvas.width;
        }
    }
    
    drawParticle(particle, ctx) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 
            particle.radius * (particle.isForeground ? 1.5 : 1),
            0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
        ctx.fill();
    }
    
    animate() {
        if (this.isSnowing) {
            this.bgCtx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
            this.fgCtx.clearRect(0, 0, this.fgCanvas.width, this.fgCanvas.height);
            
            this.particles.forEach(particle => {
                this.moveParticle(particle);
                if (particle.isForeground) {
                    this.drawParticle(particle, this.fgCtx);
                } else {
                    this.drawParticle(particle, this.bgCtx);
                }
            });
        }
        
        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SnowAnimation();
}); 