class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.initialY = y + 0.5; // Земля будет внизу клетки
        
        // Создаём фонтан частиц
        // Основная скорость всегда направлена вверх
        this.vy = -(0.05 + Math.random() * 0.05);
        // Небольшое случайное отклонение по горизонтали
        this.vx = (Math.random() - 0.5) * 0.02;
        
        this.gravity = 0.003;
        this.size = 2 + Math.random() * 2;
        this.onGround = false;
        this.groundTime = 0;
        this.fadeSpeed = 0.05;
        this.alpha = 1.0;
    }

    update() {
        if (!this.onGround) {
            // Обновляем позицию только если частица в воздухе
            this.x += this.vx;
            this.y += this.vy;
            
            // Применяем гравитацию
            this.vy += this.gravity;
            
            // Проверяем падение на землю
            if (this.y > this.initialY) {
                this.y = this.initialY;
                this.vy = 0;
                this.vx *= 0.8;
                this.onGround = true;
            }
        } else {
            // Если частица на земле, начинаем её растворять
            this.alpha = Math.max(0, this.alpha - this.fadeSpeed);
        }
    }

    render(ctx, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);
        
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha})`;
        ctx.fillRect(
            screenPos.x - this.size/2,
            screenPos.y - this.size/2,
            this.size,
            this.size
        );
    }
}

class ParticleSystem {
    constructor(game) {
        this.game = game;
        this.particles = [];
    }

    createBloodEffect(x, y, amount = 15) {
        // Создаём несколько оттенков красного
        const colors = [
            {r: 255, g: 0, b: 0},      // Ярко-красный
            {r: 200, g: 0, b: 0},      // Тёмно-красный
            {r: 180, g: 0, b: 0},      // Ещё темнее
            {r: 140, g: 0, b: 0}       // Бордовый
        ];

        // Создаём частицы
        for (let i = 0; i < amount; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new Particle(x + 0.5, y + 0.5, color)); // Создаём в центре клетки
        }
    }

    update() {
        // Обновляем все частицы
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update();
            
            // Удаляем частицы, которые полностью исчезли
            if (particle.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(ctx, camera) {
        ctx.save();
        
        // Рендерим все частицы
        for (const particle of this.particles) {
            particle.render(ctx, camera);
        }
        
        ctx.restore();
    }
}