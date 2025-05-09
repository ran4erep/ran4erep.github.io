const canvas = document.getElementById('simulatorCanvas');
const ctx = canvas.getContext('2d');

// Устанавливаем размеры canvas по размеру окна
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Вызываем функцию при загрузке и изменении размера окна
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Функция для вычисления расстояния между двумя точками
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Функция для проверки, не занята ли позиция бактериями
function isPositionFree(x, y, bacteria, minDistance = 30) {
    return !bacteria.some(b => distance(x, y, b.x, b.y) < minDistance);
}

// Функция для создания новой еды в свободном месте
function createNewFood(bacteria) {
    let x, y;
    let attempts = 0;
    const maxAttempts = 50;

    do {
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;
        attempts++;
    } while (!isPositionFree(x, y, bacteria) && attempts < maxAttempts);

    if (attempts < maxAttempts) {
        return new Food(x, y);
    }
    return null;
}

// Класс нейронной сети
class NeuralNetwork {
    constructor(inputSize = 12, hiddenSize = 12, outputSize = 4, parent = null) {
        if (parent) {
            this.weights1 = parent.weights1.map(row => 
                row.map(w => w + (Math.random() - 0.5) * 0.2));
            this.weights2 = parent.weights2.map(row => 
                row.map(w => w + (Math.random() - 0.5) * 0.2));
            this.bias1 = parent.bias1.map(b => b + (Math.random() - 0.5) * 0.2);
            this.bias2 = parent.bias2.map(b => b + (Math.random() - 0.5) * 0.2);
        } else {
            this.weights1 = Array.from({ length: hiddenSize }, () =>
                Array.from({ length: inputSize }, () => Math.random() * 2 - 1));
            this.weights2 = Array.from({ length: outputSize }, () =>
                Array.from({ length: hiddenSize }, () => Math.random() * 2 - 1));
            this.bias1 = Array.from({ length: hiddenSize }, () => Math.random() * 2 - 1);
            this.bias2 = Array.from({ length: outputSize }, () => Math.random() * 2 - 1);
        }
        this.fitness = 0;
        this.lastReward = 0;
        this.memories = []; // Память последних действий и их результатов
    }

    // Функция активации (ReLU)
    activate(x) {
        return Math.max(0, x);
    }

    // Прямое распространение
    forward(inputs) {
        // Скрытый слой с bias
        const hidden = this.weights1.map((row, i) =>
            this.activate(inputs.reduce((sum, input, j) => sum + input * row[j], 0) + this.bias1[i])
        );

        // Выходной слой с bias и разными активациями
        const outputs = this.weights2.map((row, i) =>
            Math.tanh(hidden.reduce((sum, h, j) => sum + h * row[j], 0) + this.bias2[i])
        );

        return outputs;
    }

    // Добавление опыта в память
    addMemory(state, action, reward) {
        this.memories.push({ state, action, reward });
        if (this.memories.length > 100) this.memories.shift();
        this.lastReward = reward;
        this.fitness += reward;
    }
}

// Класс для бактерий
class Bacteria {
    constructor(parent = null) {
        if (parent) {
            // Наследуем характеристики родителя при делении
            this.x = parent.x + (Math.random() - 0.5) * 10;
            this.y = parent.y + (Math.random() - 0.5) * 10;
            this.size = parent.size * 0.5;
            this.baseColor = parent.baseColor;
            this.speed = parent.speed;
            this.energy = parent.energy * 0.5;
            this.maxTrailLength = parent.maxTrailLength;
            this.brain = new NeuralNetwork(12, 12, 4, parent.brain);
            this.hunger = 0;
            this.lastMealTime = Date.now();
        } else {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = 1 + Math.random() * 2;
            this.baseColor = Math.random() * 360;
            this.speed = 1 + Math.random() * 2;
            this.energy = 100;
            this.maxTrailLength = 20;
            this.brain = new NeuralNetwork(12, 12, 4);
            this.hunger = 0;
            this.lastMealTime = Date.now();
        }
        this.color = `hsl(${this.baseColor}, 100%, 60%)`;
        this.angle = Math.random() * Math.PI * 2;
        this.trail = [];
        this.targetFood = null;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.05;
        this.energyConsumption = 0.1;
        this.sprintEnergyCost = 1.0;
        this.isDead = false;
        this.isSprinting = false;
        this.sprintCooldown = 0;
        this.divisionCooldown = 0;
        this.deathTime = null;
        this.totalFoodEaten = 0;
        this.lifetime = 0;
        this.lastInputs = [];
        this.lastOutputs = [];
    }

    // Получение входных данных для нейросети
    getInputs(food, bacteria) {
        let nearestFood = null;
        let nearestFoodDist = Infinity;
        let nearestPredator = null;
        let nearestPredatorDist = Infinity;
        let nearestPrey = null;
        let nearestPreyDist = Infinity;
        let predatorCount = 0;
        let preyCount = 0;

        // Поиск ближайшей еды
        food.forEach(f => {
            const dist = distance(this.x, this.y, f.x, f.y);
            if (dist < nearestFoodDist) {
                nearestFoodDist = dist;
                nearestFood = f;
            }
        });

        // Поиск ближайшего хищника и жертвы
        bacteria.forEach(b => {
            if (b !== this && !b.isDead) {
                const dist = distance(this.x, this.y, b.x, b.y);
                if (b.size > this.size * 1.2) {
                    if (dist < 150) predatorCount++;
                    if (dist < nearestPredatorDist) {
                        nearestPredatorDist = dist;
                        nearestPredator = b;
                    }
                } else if (b.size < this.size * 0.8) {
                    if (dist < 150) preyCount++;
                    if (dist < nearestPreyDist) {
                        nearestPreyDist = dist;
                        nearestPrey = b;
                    }
                }
            }
        });

        // Нормализация углов относительно текущего направления
        const normalizeAngle = (targetAngle) => {
            let relativeAngle = targetAngle - this.angle;
            while (relativeAngle > Math.PI) relativeAngle -= 2 * Math.PI;
            while (relativeAngle < -Math.PI) relativeAngle += 2 * Math.PI;
            return relativeAngle / Math.PI;
        };

        const foodAngle = nearestFood ? normalizeAngle(Math.atan2(nearestFood.y - this.y, nearestFood.x - this.x)) : 0;
        const predatorAngle = nearestPredator ? normalizeAngle(Math.atan2(nearestPredator.y - this.y, nearestPredator.x - this.x)) : 0;
        const preyAngle = nearestPrey ? normalizeAngle(Math.atan2(nearestPrey.y - this.y, nearestPrey.x - this.x)) : 0;

        return [
            this.energy / 100,                    // Энергия
            this.size / 10,                       // Размер
            foodAngle,                            // Направление к еде
            nearestFood ? Math.min(1, 1 / (nearestFoodDist / 100)) : 0,  // Близость еды
            predatorAngle,                        // Направление к хищнику
            nearestPredator ? Math.min(1, 1 / (nearestPredatorDist / 100)) : 0,  // Близость хищника
            preyAngle,                            // Направление к жертве
            nearestPrey ? Math.min(1, 1 / (nearestPreyDist / 100)) : 0,  // Близость жертвы
            predatorCount / 5,                    // Количество хищников рядом
            preyCount / 5,                        // Количество жертв рядом
            Math.cos(this.angle),                 // Текущее направление X
            Math.sin(this.angle)                  // Текущее направление Y
        ];
    }

    update(food, bacteria) {
        if (this.isDead) {
            if (!this.deathTime) {
                this.deathTime = Date.now();
                this.brain.addMemory(this.lastInputs, this.lastOutputs, -100); // Увеличенный штраф за смерть
            }
            // Возрождение через 20 секунд
            if (Date.now() - this.deathTime >= 20000) {
                this.isDead = false;
                this.deathTime = null;
                this.energy = 100;
                this.size = 1 + Math.random() * 2;
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                
                // Выбор лучшей нейросети для наследования
                const bestBacteria = bacteria
                    .filter(b => b !== this && b.brain.fitness > 0)
                    .sort((a, b) => b.brain.fitness - a.brain.fitness)
                    .slice(0, 5);
                
                if (bestBacteria.length > 0) {
                    const parent = bestBacteria[Math.floor(Math.random() * bestBacteria.length)];
                    this.brain = new NeuralNetwork(12, 12, 4, parent.brain);
                }
            }
            return;
        }

        this.lifetime++;

        // Обновляем голод
        const timeSinceLastMeal = (Date.now() - this.lastMealTime) / 1000; // в секундах
        this.hunger = Math.min(100, timeSinceLastMeal / 2); // Полный голод через 200 секунд

        // Умираем от голода
        if (this.hunger >= 100) {
            this.isDead = true;
            return;
        }

        // Обновляем кулдауны
        if (this.sprintCooldown > 0) this.sprintCooldown--;
        if (this.divisionCooldown > 0) this.divisionCooldown--;
        
        const inputs = this.getInputs(food, bacteria);
        const [turn, sprint, divide, attack] = this.brain.forward(inputs);
        
        this.lastInputs = inputs;
        this.lastOutputs = [turn, sprint, divide, attack];

        // Поворот
        this.angle += turn * 0.2;
        
        // Спринт при необходимости
        const needsSprint = (inputs[5] > 0.5 && inputs[4] < 0) || // Убегаем от хищника
                          (inputs[7] > 0.3 && inputs[6] > 0) || // Догоняем жертву
                          (inputs[3] > 0.5 && this.energy < 30); // Срочно нужна еда
        
        // Проверяем, достаточно ли энергии для рывка
        if (needsSprint && sprint > 0.5 && this.energy > 40 && this.sprintCooldown <= 0) {
            this.isSprinting = true;
            this.sprintCooldown = 150; // Увеличиваем время восстановления
            this.energy -= this.sprintEnergyCost; // Мгновенная трата энергии за рывок
            setTimeout(() => {
                this.isSprinting = false;
                this.energy = Math.max(0, this.energy - this.sprintEnergyCost); // Дополнительная трата в конце рывка
            }, 1000);
        }

        // Расход энергии (базовый + дополнительный при спринте)
        this.energy -= this.energyConsumption * (this.isSprinting ? 5 : 1);
        
        if (this.energy <= 0) {
            this.isDead = true;
            return;
        }

        // Движение
        const baseSpeed = this.speed * (this.energy / 100);
        const finalSpeed = this.isSprinting ? baseSpeed * 2.5 : baseSpeed;
        
        this.x += Math.cos(this.angle) * finalSpeed;
        this.y += Math.sin(this.angle) * finalSpeed;

        // Обработка границ
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;

        // Обновление следа
        this.trail.unshift({ x: this.x, y: this.y, size: this.size });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.pop();
        }

        let reward = 0;

        // Базовая награда за выживание
        reward += 0.01 * this.size;

        // Проверка столкновения с едой
        food.forEach((foodItem, index) => {
            const dist = distance(this.x, this.y, foodItem.x, foodItem.y);
            if (dist < this.size + 2) {
                food.splice(index, 1);
                this.size += 0.02;
                this.maxTrailLength = Math.min(30, this.maxTrailLength + 0.2);
                this.energy = Math.min(100, this.energy + 20);
                this.totalFoodEaten++;
                
                // Сбрасываем голод при еде
                this.hunger = 0;
                this.lastMealTime = Date.now();
                
                // Больше награды при сильном голоде
                reward += 5 * (1 + this.hunger / 50);
                
                const newFood = createNewFood(bacteria);
                if (newFood) food.push(newFood);
            }
        });

        // Взаимодействие с другими бактериями
        bacteria.forEach(other => {
            if (other !== this && !other.isDead) {
                const dist = distance(this.x, this.y, other.x, other.y);
                
                // Штраф за близость к хищнику
                if (other.size > this.size * 1.2 && dist < 50) {
                    reward -= (50 - dist) / 10;
                    // Награда за успешное избегание
                    if (this.isSprinting && dist > 50) {
                        reward += 2;
                    }
                }
                
                // Поедание при касании
                if (dist <= this.size + other.size) {
                    // Если размеры примерно равны (разница менее 20%), ничего не происходит
                    if (Math.abs(this.size - other.size) / Math.max(this.size, other.size) < 0.2) {
                        return;
                    }
                    
                    // Более крупная бактерия съедает более мелкую
                    if (this.size > other.size) {
                        this.size += other.size * 0.1;
                        this.energy = Math.min(100, this.energy + other.energy * 0.5);
                        this.maxTrailLength = Math.min(30, this.maxTrailLength + 1);
                        other.isDead = true;
                        
                        // Сбрасываем голод при поедании других бактерий
                        this.hunger = Math.max(0, this.hunger - 50);
                        this.lastMealTime = Date.now();
                        
                        reward += 10 * (other.size / this.size);
                    }
                }
            }
        });

        // Сохраняем опыт
        this.brain.addMemory(inputs, this.lastOutputs, reward);

        // Деление
        if (divide > 0.5 && this.size > 4 && this.energy > 80 && this.divisionCooldown <= 0) {
            const newBacteria = new Bacteria(this);
            bacteria.push(newBacteria);
            this.size *= 0.5;
            this.energy *= 0.5;
            this.divisionCooldown = 300;
        }
    }

    draw() {
        if (this.isDead) return;

        // Обновляем пульсацию
        this.pulsePhase += this.pulseSpeed;
        const pulse = Math.sin(this.pulsePhase) * 0.2 + 0.8;

        // Прозрачность зависит от энергии и голода
        const energyOpacity = 0.3 + (this.energy / 100) * 0.7;
        const hungerOpacity = 1 - (this.hunger / 100) * 0.7; // От 100% до 30% прозрачности при голоде
        const opacity = Math.min(energyOpacity, hungerOpacity);

        // Базовый цвет бактерии (не меняется от энергии или спринта)
        this.color = `hsl(${this.baseColor}, 100%, 60%)`;
        
        // Рисуем свечение для следа
        this.trail.forEach((point, index) => {
            const trailOpacity = (1 - (index / this.maxTrailLength)) * opacity;
            const glowSize = point.size * (1.5 + pulse * 0.5);
            
            // Внешнее свечение
            ctx.beginPath();
            ctx.arc(point.x, point.y, glowSize * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = this.color.replace('hsl', 'hsla').replace(')', `, ${trailOpacity * 0.1})`);
            ctx.fill();
            ctx.closePath();

            // Основной след
            ctx.beginPath();
            ctx.arc(point.x, point.y, glowSize, 0, Math.PI * 2);
            ctx.fillStyle = this.color.replace('hsl', 'hsla').replace(')', `, ${trailOpacity * 0.3})`);
            ctx.fill();
            ctx.closePath();
        });

        // Рисуем свечение для бактерии
        const glowSize = this.size * (1.5 + pulse * 0.5);
        
        // Внешнее свечение
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize * 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color.replace('hsl', 'hsla').replace(')', `, ${opacity * 0.1})`);
        ctx.fill();
        ctx.closePath();

        // Среднее свечение
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = this.color.replace('hsl', 'hsla').replace(')', `, ${opacity * 0.2})`);
        ctx.fill();
        ctx.closePath();

        // Внутреннее свечение
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = this.color.replace('hsl', 'hsla').replace(')', `, ${opacity * 0.4})`);
        ctx.fill();
        ctx.closePath();

        // Ядро бактерии
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color.replace('hsl', 'hsla').replace(')', `, ${opacity})`);
        ctx.fill();
        ctx.closePath();

        // Блик
        ctx.beginPath();
        ctx.arc(this.x - this.size * 0.3, this.y - this.size * 0.3, this.size * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.6})`;
        ctx.fill();
        ctx.closePath();
    }
}

// Класс для еды
class Food {
    constructor(x, y) {
        this.x = x !== undefined ? x : Math.random() * canvas.width;
        this.y = y !== undefined ? y : Math.random() * canvas.height;
        this.targetedBy = 0;
        this.pulsePhase = Math.random() * Math.PI * 2;
    }

    draw() {
        // Добавляем пульсацию для еды
        this.pulsePhase += 0.05;
        const pulse = Math.sin(this.pulsePhase) * 0.2 + 0.8;

        // Свечение
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fill();
        ctx.closePath();

        // Основная точка
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
        ctx.closePath();
    }
}

// Создаем массивы для бактерий и еды
const bacteria = Array.from({ length: 100 }, () => new Bacteria());
const food = Array.from({ length: 200 }, () => createNewFood(bacteria)).filter(f => f !== null);

// Функция анимации
function animate() {
    // Чистое очищение canvas каждый кадр
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Периодически добавляем новую еду
    if (Math.random() < 0.1 && food.length < 300) {
        const newFood = createNewFood(bacteria);
        if (newFood) food.push(newFood);
    }

    // Удаляем мертвые бактерии
    for (let i = bacteria.length - 1; i >= 0; i--) {
        if (bacteria[i].isDead) {
            bacteria.splice(i, 1);
        }
    }

    // Добавляем новые бактерии, если их стало слишком мало
    while (bacteria.length < 50) {
        bacteria.push(new Bacteria());
    }

    // Обновляем и отрисовываем еду
    food.forEach(foodItem => foodItem.draw());

    // Обновляем и отрисовываем бактерии
    bacteria.forEach(bacterium => {
        bacterium.update(food, bacteria);
        bacterium.draw();
    });

    requestAnimationFrame(animate);
}

// Запускаем анимацию
animate(); 