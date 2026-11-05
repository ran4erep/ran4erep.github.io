class DamageNumber {
    constructor(x, y, damage, isPlayerDamage, isDodged = false, isLevelUp = false) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.isPlayerDamage = isPlayerDamage;
        this.isDodged = isDodged;
        this.isLevelUp = isLevelUp;
        this.startTime = performance.now();
        this.duration = isLevelUp ? 3000 : 1500; // 3 секунды для нового уровня, 1.5 для урона
        
        // Случайные параметры для более интересной анимации
        this.angle = (Math.random() - 0.5) * 0.5; // Небольшой случайный угол для отклонения
        this.speed = 0.8 + Math.random() * 0.4; // Случайная скорость
        this.wobbleSpeed = 2 + Math.random() * 2; // Скорость колебаний
        this.wobbleAmount = 2 + Math.random() * 2; // Амплитуда колебаний
    }
}

class DamageNumberSystem {
    constructor(game) {
        this.game = game;
        this.numbers = [];
    }
    
    addNumber(x, y, damage, isPlayerDamage, isDodged = false) {
        this.numbers.push(new DamageNumber(x, y, damage, isPlayerDamage, isDodged));
    }

    addLevelUp(x, y) {
        this.numbers.push(new DamageNumber(x, y, null, false, false, true));
    }
    
    update() {
        const currentTime = performance.now();
        
        // Удаляем завершённые анимации
        this.numbers = this.numbers.filter(number => {
            const elapsed = currentTime - number.startTime;
            return elapsed < number.duration;
        });
    }
    
    render(ctx, camera) {
        const currentTime = performance.now();
        
        ctx.save();
        ctx.font = '12px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        this.numbers.forEach(number => {
            const elapsed = currentTime - number.startTime;
            const progress = elapsed / number.duration;
            
            // Нелинейное движение (быстрый старт, медленный конец)
            const moveProgress = Math.pow(progress, 0.7);
            
            // Базовое движение вверх
            const baseYOffset = -moveProgress * 48 * number.speed;
            
            // Колебания для эффекта дыма
            const wobble = Math.sin(elapsed * 0.01 * number.wobbleSpeed) * 
                          number.wobbleAmount * (1 - progress);
            
            // Отклонение в сторону
            const xOffset = Math.sin(number.angle) * moveProgress * 24 + wobble;
            
            // Вычисляем позицию на экране
            const screenPos = camera.worldToScreen(number.x, number.y);
            const x = screenPos.x + camera.tileSize/2 + xOffset;
            const y = screenPos.y + camera.tileSize/2 + baseYOffset;
            
            // Нелинейная прозрачность (медленно появляется, быстро исчезает)
            const fadeIn = Math.min(1, elapsed / 100); // Появление за 100мс
            const fadeOut = Math.max(0, 1 - Math.pow(progress * 1.3, 2));
            const alpha = fadeIn * fadeOut;
            
            // Формируем текст
            const text = number.isLevelUp ? 'НОВЫЙ УРОВЕНЬ' : (number.isDodged ? 'ПРОМАХ' : `-${number.damage}`);
            
            // Рисуем тень
            ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.5})`;
            ctx.fillText(text, x + 1, y + 1);
            
            // Рисуем текст
            ctx.strokeStyle = `rgba(100, 0, 0, ${alpha})`;
            ctx.fillStyle = number.isLevelUp ? 
                `rgba(255, 215, 0, ${alpha})` : // Золотой для нового уровня
                (number.isDodged ? `rgba(255, 255, 255, ${alpha})` : `rgba(255, 50, 50, ${alpha})`);
            
            ctx.lineWidth = 3;
            ctx.strokeText(text, x, y);
            ctx.fillText(text, x, y);
        });
        
        ctx.restore();
    }
} 