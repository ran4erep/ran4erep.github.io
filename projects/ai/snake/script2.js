// Neural Network implementation with advanced features
class NeuralNetworkV2 {
    constructor(inputSize, hiddenSizes, outputSize) {
        this.model = tf.sequential();
        
        // Простая архитектура с одним скрытым слоем
        this.model.add(tf.layers.dense({
            units: 64,
            activation: 'relu',
            inputShape: [inputSize]
        }));

        this.model.add(tf.layers.dense({
            units: outputSize,
            activation: 'linear'
        }));

        this.model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'meanSquaredError'
        });
    }

    predict(state) {
        return tf.tidy(() => {
            const stateTensor = tf.tensor2d([state]);
            return this.model.predict(stateTensor).dataSync();
        });
    }

    async train(states, targets) {
        const statesTensor = tf.tensor2d(states);
        const targetsTensor = tf.tensor2d(targets);

        await this.model.fit(statesTensor, targetsTensor, {
            epochs: 1,
            batchSize: 16,
            shuffle: true,
            verbose: 0
        });

        statesTensor.dispose();
        targetsTensor.dispose();
    }
}

class SnakeAIV2 {
    constructor(gridSize) {
        this.gridSize = gridSize;
        this.inputSize = 11;  // Упрощенное представление состояния
        this.outputSize = 3;  // Left, Forward, Right
        
        // Параметры обучения
        this.gamma = 0.95;
        this.epsilon = 1.0;
        this.epsilonMin = 0.01;
        this.epsilonDecay = 0.9995;
        this.learningRate = 0.001;
        
        // Параметры памяти
        this.memorySize = 10000;
        this.memory = [];
        this.miniBatchSize = 16;
        
        // Отслеживание производительности
        this.trainingInterval = 1;
        this.gamesPlayed = 0;
        
        // Параметры стагнации
        this.stagnationCounter = 0;
        this.stagnationThreshold = 500;
        this.penaltyMultiplier = 1.0;
        this.isStagnating = false;
        this.hasReachedMinEpsilon = false;
        this.canCheckStagnation = false; // Новый флаг для проверки возможности отслеживания стагнации
        
        // Параметры прогрессии сложности
        this.baseDifficultyMultiplier = 1.0;
        this.difficultyGrowthRate = 0.01; // Насколько быстро растет сложность
        this.maxDifficultyMultiplier = 5.0; // Максимальный множитель сложности
        
        // Инициализация нейросети
        this.brain = new NeuralNetworkV2(this.inputSize, [], this.outputSize);
    }

    calculateDifficultyMultiplier(gamesPlayed) {
        // Нелинейная прогрессия сложности
        // Используем логарифмическую функцию для более плавного роста
        const iterations = Math.floor(gamesPlayed / 10); // Каждые 10 игр
        const multiplier = 1 + Math.log10(1 + iterations * this.difficultyGrowthRate);
        return Math.min(multiplier, this.maxDifficultyMultiplier);
    }

    getState(snake, food) {
        const head = snake[0];
        const neck = snake.length > 1 ? snake[1] : null;

        // Текущее направление
        const direction = neck ? {
            x: head.x - neck.x,
            y: head.y - neck.y
        } : { x: 1, y: 0 };

        // Направление к еде
        const foodDir = {
            x: food.x - head.x,
            y: food.y - head.y
        };

        // Опасности в каждом направлении
        const dangers = this.getDangers(head, snake);

        return [
            // Нормализованное направление движения
            direction.x,
            direction.y,
            // Нормализованное направление к еде
            Math.sign(foodDir.x),
            Math.sign(foodDir.y),
            // Расстояние до еды
            Math.sqrt(foodDir.x * foodDir.x + foodDir.y * foodDir.y) / this.gridSize,
            // Опасности в 4 направлениях
            ...dangers,
            // Нормализованная длина змеи
            snake.length / (this.gridSize * this.gridSize),
            // Нормализованное количество ходов без еды
            movesSinceLastFood / 100
        ];
    }

    getDangers(head, snake) {
        const directions = [
            { x: 0, y: -1 }, // вверх
            { x: 1, y: 0 },  // вправо
            { x: 0, y: 1 },  // вниз
            { x: -1, y: 0 }  // влево
        ];

        return directions.map(dir => {
            const newPos = {
                x: head.x + dir.x,
                y: head.y + dir.y
            };

            // Проверяем столкновение со стеной или змеей
            if (newPos.x < 0 || newPos.x >= this.gridSize ||
                newPos.y < 0 || newPos.y >= this.gridSize ||
                snake.some(segment => segment.x === newPos.x && segment.y === newPos.y)) {
                return 1; // Опасность
            }
            return 0; // Безопасно
        });
    }

    getAction(state) {
        if (Math.random() < this.epsilon) {
            return Math.floor(Math.random() * this.outputSize);
        }
        const actions = this.brain.predict(state);
        return actions.indexOf(Math.max(...actions));
    }

    remember(state, action, reward, nextState, done) {
        this.memory.push([state, action, reward, nextState, done]);
        if (this.memory.length > this.memorySize) {
            this.memory.shift();
        }
    }

    async replay() {
        if (this.memory.length < this.miniBatchSize) return;

        const batch = this.getRandomBatch();
        const states = [];
        const targets = [];

        for (const [state, action, reward, nextState, done] of batch) {
            const target = this.brain.predict(state);
            
            if (done) {
                target[action] = reward * this.penaltyMultiplier;
            } else {
                const nextQ = this.brain.predict(nextState);
                target[action] = reward + this.gamma * Math.max(...nextQ);
            }

            states.push(state);
            targets.push(target);
        }

        await this.brain.train(states, targets);

        // Обновляем epsilon
        if (this.epsilon > this.epsilonMin) {
            this.epsilon *= this.epsilonDecay;
            if (this.epsilon <= this.epsilonMin) {
                this.epsilon = this.epsilonMin;
                if (!this.hasReachedMinEpsilon) {
                    this.hasReachedMinEpsilon = true;
                    this.canCheckStagnation = true; // Разрешаем проверку стагнации
                    logMessage('🎯 Достигнут минимальный эпсилон. Начинаем отслеживание стагнации.');
                } else if (this.isStagnating) {
                    this.canCheckStagnation = true; // Разрешаем новую проверку стагнации
                    this.stagnationCounter = 0; // Сбрасываем счетчик для нового отсчета
                    logMessage('🎯 Эпсилон снова минимальный. Начинаем новый отсчет стагнации.');
                }
            }
        }
    }

    getRandomBatch() {
        const batch = [];
        const batchSize = Math.min(this.miniBatchSize, this.memory.length);
        const indices = new Set();

        while (indices.size < batchSize) {
            indices.add(Math.floor(Math.random() * this.memory.length));
        }

        for (const index of indices) {
            batch.push(this.memory[index]);
        }

        return batch;
    }

    async saveModel() {
        try {
            // Получаем данные модели напрямую через save
            const modelArtifacts = await this.brain.model.save(tf.io.withSaveHandler(async (artifacts) => {
                return artifacts;
            }));
            
            // Оптимизируем историю игр
            const compressedScores = [];
            if (gameScores.length > 0) {
                let currentScore = gameScores[0];
                let count = 1;
                
                for (let i = 1; i < gameScores.length; i++) {
                    if (gameScores[i] === currentScore) {
                        count++;
                    } else {
                        compressedScores.push([currentScore, count]);
                        currentScore = gameScores[i];
                        count = 1;
                    }
                }
                compressedScores.push([currentScore, count]);
            }
            
            // Оптимизируем память
            const compressedMemory = this.memory.map(([state, action, reward, nextState, done]) => {
                // Округляем reward до 3 знаков после запятой для уменьшения размера
                const roundedReward = Math.round(reward * 1000) / 1000;
                return [
                    state.map(x => Math.round(x)), // Состояния всегда целые числа
                    action,
                    roundedReward,
                    nextState.map(x => Math.round(x)), // Следующие состояния тоже целые
                    done ? 1 : 0 // Булево в число
                ];
            });
            
            // Создаем объект с данными модели
            const saveData = {
                modelTopology: modelArtifacts.modelTopology,
                weightSpecs: modelArtifacts.weightSpecs,
                weightData: Array.from(new Uint8Array(modelArtifacts.weightData)),
                format: modelArtifacts.format,
                generatedBy: modelArtifacts.generatedBy,
                convertedBy: modelArtifacts.convertedBy,
                epsilon: Math.round(this.epsilon * 1000) / 1000, // Округляем epsilon
                memory: compressedMemory,
                stats: {
                    highScore,
                    gamesPlayed,
                    averageScore: Math.round((totalScore / gamesPlayed) * 100) / 100,
                    gameScores: compressedScores,
                    balanceHistory // Добавляем историю балансов
                },
                timestamp: new Date().toISOString()
            };
            
            // Создаем ссылку для скачивания
            const dataStr = JSON.stringify(saveData);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            // Создаем элемент для скачивания
            const a = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            a.download = `snake-ai-model-${timestamp}.r4ai`;
            a.href = url;
            a.click();
            
            // Очищаем
            URL.revokeObjectURL(url);
            logMessage('💾 Модель успешно сохранена');
            logMessage('─'.repeat(70));
        } catch (error) {
            console.error('Error saving model:', error);
            logMessage('❌ Ошибка при сохранении модели');
            logMessage('─'.repeat(70));
        }
    }
    
    async loadModel() {
        try {
            // Создаем input для выбора файла
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.r4ai';
            
            // Создаем промис для ожидания выбора файла
            const fileSelected = new Promise((resolve) => {
                input.onchange = () => resolve(input.files[0]);
            });
            
            // Запускаем диалог выбора файла
            input.click();
            
            // Ждем выбора файла
            const file = await fileSelected;
            if (!file) return;
            
            // Читаем файл
            const fileContent = await file.text();
            const saveData = JSON.parse(fileContent);
            
            // Создаем объект ModelArtifacts для загрузки
            const modelArtifacts = {
                modelTopology: saveData.modelTopology,
                weightSpecs: saveData.weightSpecs,
                weightData: new Uint8Array(saveData.weightData).buffer,
                format: 'layers-model',
                generatedBy: 'TensorFlow.js v4.2.0',
                convertedBy: null
            };
            
            // Загружаем модель напрямую из объекта ModelArtifacts
            this.brain.model = await tf.loadLayersModel(
                tf.io.fromMemory(modelArtifacts)
            );
            
            // Компилируем модель
            this.brain.model.compile({
                optimizer: tf.train.adam(0.001),
                loss: 'meanSquaredError'
            });
            
            // Восстанавливаем состояние
            this.epsilon = saveData.epsilon;
            
            // Сбрасываем параметры стагнации и штрафов
            this.stagnationCounter = 0;
            this.penaltyMultiplier = 1.0;
            this.isStagnating = false;
            
            // Если загруженная модель имеет минимальный эпсилон, активируем проверку стагнации
            if (this.epsilon <= this.epsilonMin) {
                this.hasReachedMinEpsilon = true;
                this.canCheckStagnation = true;
                logMessage('🎯 Загруженная модель имеет минимальный эпсилон. Активирую отслеживание стагнации.');
            }
            
            // Распаковываем память
            this.memory = saveData.memory.map(([state, action, reward, nextState, done]) => [
                state,
                action,
                reward,
                nextState,
                done === 1 // Преобразуем число обратно в булево
            ]);
            
            // Восстанавливаем статистику
            highScore = saveData.stats.highScore;
            gamesPlayed = saveData.stats.gamesPlayed;
            totalScore = saveData.stats.averageScore * gamesPlayed;
            
            // Распаковываем историю игр
            gameScores = [];
            for (const [score, count] of saveData.stats.gameScores) {
                gameScores.push(...Array(count).fill(score));
            }

            // Восстанавливаем историю балансов
            if (saveData.stats.balanceHistory) {
                balanceHistory = saveData.stats.balanceHistory;
            }
            
            updateChart(); // Обновляем график с загруженными данными
            updateScore();
            document.getElementById('high-score').textContent = highScore;
            
            // Добавляем сообщение в лог
            logMessage('📥 Модель загружена из файла ' + file.name);
            logMessage(`📅 Сохранена: ${new Date(saveData.timestamp).toLocaleString()}`);
            logMessage(`🏆 Рекорд: ${highScore}, Итераций: ${gamesPlayed}`);
            logMessage('─'.repeat(70));
            
        } catch (error) {
            console.error('Error loading model:', error);
            logMessage('❌ Ошибка при загрузке модели');
            logMessage('─'.repeat(70));
        }
    }

    checkStagnation(currentScore) {
        // Проверяем стагнацию только если разрешено
        if (!this.canCheckStagnation) return;

        if (currentScore > highScore) {
            this.stagnationCounter = 0;
            if (this.isStagnating) {
                this.isStagnating = false;
                this.penaltyMultiplier = 1.0;
                this.epsilon = this.epsilonMin;
                logMessage('🔄 Выход из режима стагнации. Штрафы и эпсилон возвращены к норме.');
            }
        } else {
            this.stagnationCounter++;
            console.log(this.stagnationCounter);
            
            // Проверяем на стагнацию только когда эпсилон минимальный
            if (this.stagnationCounter >= this.stagnationThreshold && !this.isStagnating) {
                this.isStagnating = true;
                this.canCheckStagnation = false; // Запрещаем проверку до следующего достижения минимального эпсилона
                this.epsilon = Math.min(0.3, this.epsilon + 0.2);
                this.penaltyMultiplier = 1.5;
                
                logMessage(`⚠️ Обнаружена стагнация после ${this.stagnationThreshold} игр без улучшения рекорда ${highScore}.`);
                logMessage(`🔄 Эпсилон увеличен до ${this.epsilon.toFixed(3)}, штрафы усилены в ${this.penaltyMultiplier}x раз.`);
            }
        }
    }
}

// Game variables
const GRID_SIZE = 20;
const CELL_SIZE = 20;
let snake, food, direction, score, highScore = 0;
let gameLoopId;
let lastUpdateTime = 0;
let GAME_SPEED = 15;
let UPDATES_PER_FRAME = 1;
let isChartHovered = false;
let movesSinceLastFood = 0;
let gamesPlayed = 0;
let totalScore = 0;
let gameScores = [];
let balanceHistory = []; // История балансов для каждой игры
let rewardsHistory = []; // История наград
let penaltiesHistory = []; // История штрафов
let isProcessingUpdate = false;
let currentGameRewards = 0;
let currentGamePenalties = 0;
let scoreDistribution = new Map(); // Для подсчета количества игр с каждым счетом
let maxLength = 3; // Максимальная достигнутая длина змеи

// Initialize AI
const ai = new SnakeAIV2(GRID_SIZE);

// Set up game board dimensions
const gameBoard = document.getElementById('game-board');
gameBoard.style.width = `${GRID_SIZE * CELL_SIZE}px`;
gameBoard.style.height = `${GRID_SIZE * CELL_SIZE}px`;
gameBoard.style.display = 'grid';
gameBoard.style.gridTemplateColumns = `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`;
gameBoard.style.gridTemplateRows = `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`;

// Game functions
async function runGameLoop(timestamp) {
    gameLoopId = requestAnimationFrame(runGameLoop);
    
    // Если вкладка была неактивна, сбрасываем lastUpdateTime
    if (timestamp - lastUpdateTime > 1000) {
        lastUpdateTime = timestamp - (1000 / GAME_SPEED);
    }
    
    const interval = 1000 / GAME_SPEED; // миллисекунды между обновлениями
    
    if (timestamp - lastUpdateTime >= interval) {
        if (!isProcessingUpdate) {
            isProcessingUpdate = true;
            try {
                // Выполняем несколько обновлений за один кадр
                for (let i = 0; i < UPDATES_PER_FRAME; i++) {
                    await updateGame();
                }
            } finally {
                isProcessingUpdate = false;
                lastUpdateTime = timestamp;
            }
        }
    }
}

function initGame() {
    snake = [
        {x: 10, y: 10},
        {x: 9, y: 10},
        {x: 8, y: 10}
    ];
    direction = 'right';
    score = 0;
    movesSinceLastFood = 0;
    currentGameRewards = 0;
    currentGamePenalties = 0;
    generateFood();
    updateScore();
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoopId = requestAnimationFrame(runGameLoop);
}

function generateFood() {
    food = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
    };
    while (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
        food = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
    }
}

async function updateGame() {
    const state = ai.getState(snake, food);
    const action = ai.getAction(state);
    const oldDistance = Math.abs(snake[0].x - food.x) + Math.abs(snake[0].y - food.y);

    // Convert action to direction
    switch(action) {
        case 0: // Left
            direction = direction === 'up' ? 'left' : 
                       direction === 'left' ? 'down' : 
                       direction === 'down' ? 'right' : 'up';
            break;
        case 2: // Right
            direction = direction === 'up' ? 'right' : 
                       direction === 'right' ? 'down' : 
                       direction === 'down' ? 'left' : 'up';
            break;
    }

    const head = {...snake[0]};
    switch(direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }

    const collision = head.x < 0 || head.x >= GRID_SIZE || 
                     head.y < 0 || head.y >= GRID_SIZE ||
                     snake.some(segment => segment.x === head.x && segment.y === head.y);

    if (collision) {
        // Усиливаем штраф за столкновение
        // Базовый штраф -2
        // Дополнительно -1 за каждые 3 единицы длины после 3
        // И квадратичный штраф для очень длинных змей
        const baseLength = 3;
        const lengthDiff = snake.length - baseLength;
        const linearPenalty = -2 - Math.floor(lengthDiff / 3);
        const quadraticPenalty = -Math.pow(lengthDiff / 10, 2); // Квадратичный штраф для длинных змей
        const lengthPenalty = linearPenalty + quadraticPenalty;
        
        const difficultyMultiplier = ai.calculateDifficultyMultiplier(gamesPlayed);
        const finalPenalty = lengthPenalty * ai.penaltyMultiplier * difficultyMultiplier;
        currentGamePenalties += finalPenalty;
        
        // Проверяем рекорд до подсчета статистики
        if (score > highScore) {
            const oldHighScore = highScore;
            // Увеличиваем бонус за рекорд
            // Базовый бонус за сам факт рекорда
            const baseRecordBonus = 3.0;
            // Дополнительный бонус за каждое очко превышения
            const extraPointsBonus = (score - oldHighScore) * 2.0;
            // Бонус за существенное превышение (если побили рекорд больше чем на 2 очка)
            const breakthroughBonus = score - oldHighScore >= 2 ? 2.0 : 0;
            
            // Применяем обратный множитель сложности к наградам
            const recordBonus = (baseRecordBonus + extraPointsBonus + breakthroughBonus) / difficultyMultiplier;
            currentGameRewards += recordBonus;
            highScore = score;
            document.getElementById('high-score').textContent = highScore;
            logMessage(`🏆 Новый рекорд: ${score}! Бонус: +${recordBonus.toFixed(1)} (базовый: ${(baseRecordBonus/difficultyMultiplier).toFixed(1)}, за очки: ${(extraPointsBonus/difficultyMultiplier).toFixed(1)}${breakthroughBonus > 0 ? `, прорыв: ${(breakthroughBonus/difficultyMultiplier).toFixed(1)}` : ''} [x${difficultyMultiplier.toFixed(2)}]`, gamesPlayed);
        }

        gamesPlayed++;
        totalScore += score;
        gameScores.push(score);
        
        // Проверяем стагнацию
        ai.checkStagnation(score);
        
        // Сохраняем награды и штрафы текущей игры
        rewardsHistory.push(currentGameRewards);
        penaltiesHistory.push(currentGamePenalties);
        
        // Сохраняем общий баланс
        const currentBalance = currentGameRewards + currentGamePenalties;
        balanceHistory.push(currentBalance);
        
        // Обновляем распределение счета
        scoreDistribution.set(score, (scoreDistribution.get(score) || 0) + 1);
        
        updateChart();

        const nextState = ai.getState(snake, food);
        ai.remember(state, action, finalPenalty, nextState, true);
        
        if (gamesPlayed % ai.trainingInterval === 0) {
            await ai.replay();
            if (gamesPlayed % 10 === 0) {
                const avgScore = (totalScore / gamesPlayed).toFixed(2);
                if (!ai.isStagnating && ai.epsilon > ai.epsilonMin) {
                    logMessage(`🧠 Обучение продолжается... Эпсилон: ${ai.epsilon.toFixed(5)}`, gamesPlayed);
                }

                // Считаем статистику только за последние 10 игр
                const last10Scores = gameScores.slice(-10);
                const last10Distribution = new Map();
                last10Scores.forEach(score => {
                    last10Distribution.set(score, (last10Distribution.get(score) || 0) + 1);
                });

                // Формируем строку статистики за последние 10 игр
                const stats = Array.from(last10Distribution.entries())
                    .sort((a, b) => b[0] - a[0])
                    .map(([score, count]) => `${score} ${score === 1 ? 'очко' : score >= 2 && score <= 4 ? 'очка' : 'очков'} (${count} ${count === 1 ? 'раз' : count >= 2 && count <= 4 ? 'раза' : 'раз'})`)
                    .join(', ');

                // Считаем суммарные награды и штрафы за последние 10 игр
                const last10Rewards = rewardsHistory.slice(-10);
                const last10Penalties = penaltiesHistory.slice(-10);
                const total10Rewards = last10Rewards.reduce((a, b) => a + b, 0);
                const total10Penalties = last10Penalties.reduce((a, b) => a + b, 0);

                // Определяем цвет для общего баланса
                const totalBalance = total10Rewards + total10Penalties;
                const balanceColor = totalBalance >= 0 ? 'color: #22c55e' : 'color: #ef4444';
                
                // Форматируем строку баланса
                let totalBalanceStr;
                if (Math.abs(totalBalance) < 0.1) {
                    totalBalanceStr = '0';
                } else {
                    totalBalanceStr = totalBalance > 0 ? `+${totalBalance.toFixed(1)}` : totalBalance.toFixed(1);
                }

                logMessage(`📊 Итоги: ${stats}
                    Заработано: <span style="color: #22c55e">+${total10Rewards.toFixed(1)}</span> Оштрафовано: <span style="color: #ef4444">${total10Penalties.toFixed(1)}</span> | Общий баланс: <span style="${balanceColor}">${totalBalanceStr}</span>`, gamesPlayed);
            }
        }

        initGame();
        return;
    }

    snake.unshift(head);
    movesSinceLastFood++;

    let reward = 0;
    const newDistance = Math.abs(head.x - food.x) + Math.abs(head.y - food.y);

    if (head.x === food.x && head.y === food.y) {
        score++;
        movesSinceLastFood = 0;
        generateFood();
        
        const baseReward = 1;
        const lengthBonus = Math.floor((snake.length - 3) / 5) * 0.3;
        const difficultyMultiplier = ai.calculateDifficultyMultiplier(gamesPlayed);
        reward = (baseReward + lengthBonus) / difficultyMultiplier;
        
        currentGameRewards += reward;
        
        // Если это новый абсолютный рекорд длины, даем дополнительный бонус
        if (snake.length > maxLength) {
            const lengthRecordBonus = 0.5 / difficultyMultiplier;
            currentGameRewards += lengthRecordBonus;
            reward += lengthRecordBonus;
            maxLength = snake.length;
            //logMessage(`🌟 Новый рекорд длины: ${snake.length}! Бонус: +${lengthRecordBonus.toFixed(1)}`, gamesPlayed);
        }
    } else {
        snake.pop();
        const difficultyMultiplier = ai.calculateDifficultyMultiplier(gamesPlayed);
        reward = (oldDistance - newDistance) * 0.1 / difficultyMultiplier;
        if (reward > 0) currentGameRewards += reward;
        else if (reward < 0) currentGamePenalties += reward * difficultyMultiplier;
    }

    const nextState = ai.getState(snake, food);
    ai.remember(state, action, reward, nextState, false);

    updateScore();
    renderGame();
}

function renderGame() {
    gameBoard.innerHTML = '';
    
    snake.forEach((segment, index) => {
        const element = document.createElement('div');
        element.style.gridRowStart = segment.y + 1;
        element.style.gridColumnStart = segment.x + 1;
        element.classList.add(index === 0 ? 'snake-head' : 'snake-segment');
        element.style.width = '100%';
        element.style.height = '100%';
        gameBoard.appendChild(element);
    });

    const foodElement = document.createElement('div');
    foodElement.style.gridRowStart = food.y + 1;
    foodElement.style.gridColumnStart = food.x + 1;
    foodElement.classList.add('food');
    foodElement.style.width = '100%';
    foodElement.style.height = '100%';
    gameBoard.appendChild(foodElement);
}

function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('games-played').textContent = gamesPlayed;
    document.getElementById('average-score').textContent = 
        gamesPlayed > 0 ? (totalScore / gamesPlayed).toFixed(2) : '0.00';
    document.getElementById('epsilon').textContent = ai.epsilon.toFixed(3);
}

// Initialize chart
let progressChart;
function initChart() {
    const canvas = document.getElementById('progress-chart');
    
    // Добавляем обработчики для остановки/возобновления обновлений при наведении
    canvas.addEventListener('mouseenter', () => {
        isChartHovered = true;
    });
    
    canvas.addEventListener('mouseleave', () => {
        isChartHovered = false;
        // При уходе курсора обновляем график до текущего состояния
        updateChart();
    });

    const ctx = canvas.getContext('2d');
    progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [1, 2, 3, 4, 5, 6],
            datasets: [{
                label: 'Очки',
                data: [null, null, null, null, null, null],
                borderColor: '#5eead4',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 1.5,
                fill: false
            },
            {
                label: 'Средний показатель',
                data: [null, null, null, null, null, null],
                borderColor: '#8b5cf6',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 1.5,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    min: 0,
                    max: 3,
                    ticks: {
                        stepSize: 1,
                        precision: 0
                    }
                },
                x: {
                    min: 1,
                    max: 6,
                    ticks: {
                        stepSize: 1,
                        precision: 0
                    }
                }
            },
            plugins: {
                tooltip: {
                    enabled: true
                }
            }
        }
    });
}

function updateChart() {
    // Если курсор на графике - не обновляем
    if (isChartHovered) return;
    
    const windowSize = 25; // Показываем последние 25 игр
    
    // Если нет данных, показываем пустой график с делениями от 0 до 3
    if (gameScores.length === 0) {
        progressChart.data.labels = [1, 2, 3, 4, 5, 6];
        progressChart.data.datasets[0].data = [null, null, null, null, null, null];
        progressChart.data.datasets[1].data = [null, null, null, null, null, null];
        progressChart.options.scales.x.min = 1;
        progressChart.options.scales.x.max = 6;
        progressChart.options.scales.y.min = 0;
        progressChart.options.scales.y.max = 3;
        progressChart.options.scales.y.ticks.stepSize = 1;
    } else {
        // Определяем диапазон отображаемых данных
        const startIdx = Math.max(0, gameScores.length - windowSize);
        const visibleScores = gameScores.slice(startIdx);
        
        // Создаем метки с реальными номерами итераций
        const labels = Array.from(
            {length: visibleScores.length}, 
            (_, i) => startIdx + i + 1
        );
        
        progressChart.data.labels = labels;
        progressChart.data.datasets[0].data = visibleScores;
        
        // Устанавливаем границы оси X
        progressChart.options.scales.x.min = labels[0];
        progressChart.options.scales.x.max = labels[labels.length - 1];

        // Обновляем скользящее среднее
        const movingAverageWindow = 10;
        const movingAverages = new Array(visibleScores.length).fill(null);
        
        for (let i = 0; i < visibleScores.length; i++) {
            const dataStartIdx = Math.max(0, i - movingAverageWindow + 1);
            const windowScores = visibleScores.slice(dataStartIdx, i + 1);
            const average = windowScores.reduce((a, b) => a + b, 0) / windowScores.length;
            movingAverages[i] = average;
        }

        progressChart.data.datasets[1].data = movingAverages;

        // Обновляем максимум оси Y, учитывая рекорд
        const maxScore = Math.max(highScore, ...visibleScores);
        const yMax = Math.ceil(maxScore * 1.1); // Добавляем 10% сверху
        progressChart.options.scales.y.max = yMax;
        progressChart.options.scales.y.ticks.stepSize = Math.max(1, Math.floor(yMax / 10));
    }

    progressChart.update('none');
}

// Event listeners
document.getElementById('save-model').addEventListener('click', () => ai.saveModel());
document.getElementById('load-model').addEventListener('click', () => ai.loadModel());

function updateSliderProgress(slider) {
    const min = parseInt(slider.min);
    const max = parseInt(slider.max);
    const value = parseInt(slider.value);
    const progress = ((value - min) / (max - min)) * 100;
    slider.style.setProperty('--range-progress', `${progress}%`);
}

const speedSlider = document.getElementById('speed-slider');
speedSlider.addEventListener('input', (e) => {
    const speed = parseInt(e.target.value);
    
    if (speed <= 100) {
        // От 1 до 100: экспоненциальное увеличение от 0.2 до 15 обновлений в секунду
        // Используем экспоненту для более плавного ускорения
        const t = (speed - 1) / 99; // нормализуем к [0,1]
        GAME_SPEED = 0.2 + (15 - 0.2) * Math.pow(t, 2); // квадратичная интерполяция
        UPDATES_PER_FRAME = 1;
    } else {
        // От 100 до 300: увеличиваем количество обновлений за кадр
        GAME_SPEED = 15;
        UPDATES_PER_FRAME = Math.floor((speed - 100) / 10) + 1;
    }
    
    document.getElementById('speed-value').textContent = speed;
    updateSliderProgress(speedSlider);
});

// Обработчик кнопки копирования лога
document.getElementById('copy-log').addEventListener('click', async () => {
    const gameLog = document.getElementById('game-log');
    const button = document.getElementById('copy-log');
    const tooltip = document.querySelector('.copy-tooltip');
    
    try {
        await navigator.clipboard.writeText(gameLog.value);
        tooltip.classList.add('show');
        setTimeout(() => tooltip.classList.remove('show'), 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
});

// Обновление кастомного скроллбара
function updateCustomScrollbar() {
    const gameLog = document.getElementById('game-log');
    const thumb = document.querySelector('.scrollbar-thumb');
    const trackHeight = document.querySelector('.scrollbar-track').clientHeight;
    const scrollPercentage = (gameLog.scrollTop / (gameLog.scrollHeight - gameLog.clientHeight)) || 0;
    const thumbHeight = Math.max((gameLog.clientHeight / gameLog.scrollHeight) * trackHeight, 30);
    const maxTop = trackHeight - thumbHeight;
    
    thumb.style.height = `${thumbHeight}px`;
    thumb.style.top = `${scrollPercentage * maxTop}px`;
}

// Добавляем перетаскивание скроллбара
let isDragging = false;
let startY = 0;
let startTop = 0;

const thumb = document.querySelector('.scrollbar-thumb');
const track = document.querySelector('.scrollbar-track');

thumb.addEventListener('mousedown', (e) => {
    isDragging = true;
    startY = e.clientY;
    startTop = parseInt(thumb.style.top || '0');
    document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaY = e.clientY - startY;
    const trackHeight = track.clientHeight;
    const thumbHeight = thumb.clientHeight;
    const maxTop = trackHeight - thumbHeight;
    
    let newTop = Math.max(0, Math.min(maxTop, startTop + deltaY));
    thumb.style.top = `${newTop}px`;
    
    // Обновляем позицию в логе
    const gameLog = document.getElementById('game-log');
    const scrollPercentage = newTop / maxTop;
    gameLog.scrollTop = scrollPercentage * (gameLog.scrollHeight - gameLog.clientHeight);
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.userSelect = '';
});

// Инициализация обработчиков событий для скроллбара
const gameLog = document.getElementById('game-log');
let isUserScrolling = false;
let scrollTimeout;

gameLog.addEventListener('scroll', () => {
    updateCustomScrollbar();
    // Убираем автоматическую установку флага скроллинга
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        // Проверяем, находимся ли мы внизу лога
        const isAtBottom = gameLog.scrollHeight - gameLog.clientHeight - gameLog.scrollTop <= 2;
        if (isAtBottom) {
            isUserScrolling = false;
        }
    }, 150);
});

// Добавляем обработчик для ручного скроллинга
gameLog.addEventListener('mousedown', () => {
    isUserScrolling = true;
});

// Добавляем обработчик колесика мыши
gameLog.addEventListener('wheel', () => {
    isUserScrolling = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        // Проверяем, находимся ли мы внизу лога
        const isAtBottom = gameLog.scrollHeight - gameLog.clientHeight - gameLog.scrollTop <= 2;
        if (isAtBottom) {
            isUserScrolling = false;
        }
    }, 150);
});

new ResizeObserver(updateCustomScrollbar).observe(gameLog);

// Первоначальное обновление скроллбара
updateCustomScrollbar();

// Initialize game and slider
initChart();
initGame();
updateSliderProgress(speedSlider);

function logMessage(message, iteration = null) {
    const gameLog = document.getElementById('game-log');
    const timestamp = new Date().toLocaleTimeString();
    const iterationStr = iteration !== null ? `[Итерация ${iteration}]` : '';
    
    // Проверяем, был ли лог прокручен до конца
    const wasAtBottom = gameLog.scrollHeight - gameLog.clientHeight - gameLog.scrollTop <= 2;
    
    // Добавляем новую строку как HTML
    const newLine = document.createElement('div');
    
    if (iteration !== null && iteration % 10 === 0 && message.includes('Итоги:')) {
        const difficultyMultiplier = ai.calculateDifficultyMultiplier(iteration);
        const multiplierInfo = ` | 💫 x${difficultyMultiplier.toFixed(2)}`;
        // Вставляем множитель сложности перед закрывающим тегом span последнего элемента
        const modifiedMessage = message.replace(/<\/span>$/, `${multiplierInfo}</span>`);
        newLine.innerHTML = `[${timestamp}] ${iterationStr} ${modifiedMessage}`;
    } else {
        newLine.innerHTML = `[${timestamp}] ${iterationStr} ${message}`;
    }
    
    gameLog.appendChild(newLine);
    
    // Если лог был прокручен до конца или не было пользовательского скроллинга,
    // прокручиваем к новому сообщению
    if (wasAtBottom || !isUserScrolling) {
        requestAnimationFrame(() => {
            gameLog.scrollTop = gameLog.scrollHeight;
            updateCustomScrollbar();
        });
    }
} 