class HUD {
    constructor() {
        // FPS счетчик
        this.fpsCounter = document.createElement('div');
        this.fpsCounter.style.position = 'fixed';
        this.fpsCounter.style.top = '10px';
        this.fpsCounter.style.left = '10px';
        this.fpsCounter.style.color = '#fff';
        this.fpsCounter.style.fontFamily = 'monospace';
        this.fpsCounter.style.zIndex = '1000';
        document.body.appendChild(this.fpsCounter);
        this.fpsCounter.textContent = 'FPS: 0';
        
        // Индикатор здоровья
        this.healthDisplay = document.createElement('div');
        this.healthDisplay.style.position = 'fixed';
        this.healthDisplay.style.bottom = '20px';
        this.healthDisplay.style.left = '20px';
        this.healthDisplay.style.color = '#fff';
        this.healthDisplay.style.fontFamily = 'monospace';
        this.healthDisplay.style.fontSize = '24px';
        this.healthDisplay.style.zIndex = '1000';
        document.body.appendChild(this.healthDisplay);
        
        this.frameCount = 0;
        this.lastFpsUpdate = performance.now();
        
        // Эффект получения урона
        this.damageOverlay = document.createElement('div');
        this.damageOverlay.style.position = 'fixed';
        this.damageOverlay.style.top = '0';
        this.damageOverlay.style.left = '0';
        this.damageOverlay.style.width = '100%';
        this.damageOverlay.style.height = '100%';
        this.damageOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0)';
        this.damageOverlay.style.pointerEvents = 'none';
        this.damageOverlay.style.transition = 'background-color 0.1s ease-out';
        this.damageOverlay.style.zIndex = '999';
        document.body.appendChild(this.damageOverlay);

        // Эффект промаха
        this.missOverlay = document.createElement('div');
        this.missOverlay.style.position = 'fixed';
        this.missOverlay.style.top = '0';
        this.missOverlay.style.left = '0';
        this.missOverlay.style.width = '100%';
        this.missOverlay.style.height = '100%';
        this.missOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0)';
        this.missOverlay.style.pointerEvents = 'none';
        this.missOverlay.style.transition = 'background-color 0.1s ease-out';
        this.missOverlay.style.zIndex = '999';
        document.body.appendChild(this.missOverlay);
    }

    update(deltaTime) {
        const currentTime = performance.now();
        this.frameCount++;
        
        if (currentTime - this.lastFpsUpdate >= 1000) {
            const fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
            this.fpsCounter.textContent = `FPS: ${fps}`;
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }
    }
    
    updateHealth(health, maxHealth) {
        const healthPercent = (health / maxHealth) * 100;
        const color = healthPercent > 66 ? '#00ff00' : 
                     healthPercent > 33 ? '#ffff00' : '#ff0000';
        this.healthDisplay.innerHTML = `❤️ ${health}/${maxHealth}`;
        this.healthDisplay.style.color = color;
    }
    
    showDamageEffect() {
        this.damageOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
        setTimeout(() => {
            this.damageOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0)';
        }, 100);
    }

    showMissEffect() {
        this.missOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        setTimeout(() => {
            this.missOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0)';
        }, 100);
    }
}

const hud = new HUD(); 