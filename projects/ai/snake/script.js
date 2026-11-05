class NeuralNetwork {
    constructor(inputSize, hiddenSizes, outputSize) {
        this.model = tf.sequential();
        this.model.add(tf.layers.dense({units: hiddenSizes[0], activation: 'relu', inputShape: [inputSize]}));
        for (let i = 1; i < hiddenSizes.length; i++) {
            this.model.add(tf.layers.dense({units: hiddenSizes[i], activation: 'relu'}));
        }
        this.model.add(tf.layers.dense({units: outputSize, activation: 'linear'}));
        this.model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'meanSquaredError',
            metrics: ['accuracy']
        });
        this.isTraining = false;
        this.predictionBuffer = null;
    }

    predict(state) {
        return tf.tidy(() => {
            // Reuse tensor if input is the same
            if (this.predictionBuffer && 
                this.predictionBuffer.state.every((val, idx) => val === state[idx])) {
                return this.predictionBuffer.prediction;
            }

            const stateTensor = tf.tensor2d([state]);
            const prediction = this.model.predict(stateTensor).dataSync();
            
            // Cache prediction
            this.predictionBuffer = {
                state: [...state],
                prediction: [...prediction]
            };
            
            return prediction;
        });
    }

    async train(states, targets) {
        if (this.isTraining) return;
        this.isTraining = true;
        this.predictionBuffer = null; // Clear prediction cache
        
        try {
            const statesTensor = tf.tensor2d(states);
            const targetsTensor = tf.tensor2d(targets);

            await this.model.fit(statesTensor, targetsTensor, {
                epochs: 1,
                shuffle: true,
                batchSize: 32,
                verbose: 0 // Disable training logs
            });

            statesTensor.dispose();
            targetsTensor.dispose();
        } finally {
            this.isTraining = false;
        }
    }
}

class SnakeAI {
    constructor(gridSize) {
        this.gridSize = gridSize;
        this.inputSize = 15;  // 4 + 4 + 3 + 4 новых параметра
        this.hiddenSizes = [64, 32];
        this.outputSize = 3;  // Left, Forward, Right
        this.gamma = 0.99;
        this.epsilon = 1;
        this.epsilonMin = 0.1;  // Увеличиваем минимальное значение
        this.epsilonDecay = 0.9995;  // Замедляем decay еще больше
        this.memorySize = 10000;
        this.batchSize = 64;  // Уменьшаем размер батча для более частого обучения
        this.memory = [];
        this.priorityMemory = [];  // Память для важного опыта
        this.maxPriorityMemory = 2000;  // Увеличиваем размер приоритетной памяти
        this.lastScores = [];  // Хранение последних результатов
        this.scoreWindow = 50;  // Размер окна для отслеживания прогресса
        this.trainingInterval = 50;  // Уменьшаем интервал обучения
        this.lastTrainingScore = 0;  // Последний результат перед обучением

        // Создаем две нейронные сети для Double DQN
        this.brain = new NeuralNetwork(this.inputSize, this.hiddenSizes, this.outputSize);
        this.targetBrain = new NeuralNetwork(this.inputSize, this.hiddenSizes, this.outputSize);
        this.updateTargetNetwork();  // Копируем веса в целевую сеть
        
        // Добавляем параметры для нормализации
        this.normalization = {
            scoreMax: 1,
            lengthMax: 1,
            movesMax: 1
        };
    }

    // Новый метод для обновления целевой сети
    async updateTargetNetwork() {
        const weights = this.brain.model.getWeights();
        const targetWeights = weights.map(w => w.clone());
        await this.targetBrain.model.setWeights(targetWeights);
    }

    // Обновляем метод нормализации состояния
    normalizeState(state) {
        const normalized = [...state];
        // Нормализуем только новые параметры (последние 4)
        normalized[11] = state[11] / this.normalization.scoreMax;  // scoreRatio
        normalized[12] = state[12];  // foodProgress уже нормализован
        normalized[13] = state[13] / this.normalization.lengthMax;  // snakeLengthRatio
        normalized[14] = state[14];  // circlingDanger уже нормализован
        return normalized;
    }

    // Обновляем метод обновления нормализации
    updateNormalization(score, length) {
        this.normalization.scoreMax = Math.max(this.normalization.scoreMax, score || 1);
        this.normalization.lengthMax = Math.max(this.normalization.lengthMax, length || 1);
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
                    gameScores: compressedScores
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
            console.log('Model saved to file');
            logMessage('Модель успешно сохранена');
            logMessage('─'.repeat(70));
        } catch (error) {
            console.error('Error saving model:', error);
            logMessage('Ошибка при сохранении модели');
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
                loss: 'meanSquaredError',
                metrics: ['accuracy']
            });
            
            // Восстанавливаем состояние
            this.epsilon = saveData.epsilon;
            
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
            
            updateChart(); // Обновляем график с загруженными данными
            updateScore();
            highScoreElement.textContent = highScore; // Явно обновляем элемент с рекордом
            
            // Добавляем сообщение в лог
            logMessage(`Модель загружена из файла ${file.name}`);
            logMessage(`Сохранена: ${new Date(saveData.timestamp).toLocaleString()}`);
            logMessage(`Рекорд: ${highScore}, Игр сыграно: ${gamesPlayed}`);
            logMessage('─'.repeat(70));
            
        } catch (error) {
            console.error('Error loading model:', error);
            logMessage('Ошибка при загрузке модели');
            logMessage('─'.repeat(70));
        }
    }

    getState(snake, food) {
        const head = snake[0];
        const neck = snake[1];
        
        let direction;
        if (head.x > neck.x) direction = [1, 0, 0, 0];  // Right
        else if (head.x < neck.x) direction = [0, 1, 0, 0];  // Left
        else if (head.y < neck.y) direction = [0, 0, 1, 0];  // Up
        else direction = [0, 0, 0, 1];  // Down

        const foodDirection = [
            food.x < head.x ? 1 : 0,
            food.x > head.x ? 1 : 0,
            food.y < head.y ? 1 : 0,
            food.y > head.y ? 1 : 0
        ];

        const dangerStraight = this.checkCollision(head, direction);
        const dangerRight = this.checkCollision(head, this.rotateClockwise(direction));
        const dangerLeft = this.checkCollision(head, this.rotateCounterClockwise(direction));

        // Добавляем новые параметры состояния
        const scoreRatio = score / (highScore || 1);
        const foodProgress = movesSinceLastFood / 50;
        const snakeLengthRatio = (snake.length - 3) / (highScore || 1);
        const circlingDanger = this.calculateCirclingDanger(snake);

        return [
            ...direction,          // 4 значения
            ...foodDirection,      // 4 значения
            dangerStraight,       // 1 значение
            dangerRight,          // 1 значение
            dangerLeft,           // 1 значение
            scoreRatio,           // Прогресс к рекорду
            foodProgress,         // Прогресс к штрафу за отсутствие еды
            snakeLengthRatio,     // Относительная длина
            circlingDanger        // Опасность кружения
        ];
    }

    calculateCirclingDanger(snake) {
        const positions = snake.slice(0, Math.min(10, snake.length))
            .map(pos => `${pos.x},${pos.y}`);
        const uniquePositions = new Set(positions);
        return Math.min(1, uniquePositions.size / positions.length);
    }

    checkCollision(point, direction) {
        const newPoint = {
            x: point.x + direction[0] - direction[1],
            y: point.y + direction[3] - direction[2]
        };

        return (newPoint.x < 0 || newPoint.x >= this.gridSize ||
                newPoint.y < 0 || newPoint.y >= this.gridSize) ? 1 : 0;
    }

    rotateClockwise(direction) {
        return [direction[2], direction[3], direction[1], direction[0]];
    }

    rotateCounterClockwise(direction) {
        return [direction[3], direction[2], direction[0], direction[1]];
    }

    getAction(state) {
        // Добавляем небольшую вероятность случайного действия даже при низком epsilon
        if (Math.random() < this.epsilon || Math.random() < 0.05) {
            return Math.floor(Math.random() * this.outputSize);
        }
        const actions = this.brain.predict(state);
        return actions.indexOf(Math.max(...actions));
    }

    remember(state, action, reward, nextState, done) {
        const experience = [state, action, reward, nextState, done];
        
        // Добавляем в обычную память
        this.memory.push(experience);
        if (this.memory.length > this.memorySize) {
            this.memory.shift();
        }

        // Добавляем в приоритетную память если:
        // 1. Получена большая награда (еда)
        // 2. Это терминальное состояние с хорошим счётом
        // 3. Это важное негативное состояние
        if (reward > 0.5 || (done && score > 5) || reward < -1) {
            this.priorityMemory.push(experience);
            if (this.priorityMemory.length > this.maxPriorityMemory) {
                this.priorityMemory.shift();
            }
        }

        // Сохраняем счёт если это конец игры
        if (done) {
            this.lastScores.push(score);
            if (this.lastScores.length > this.scoreWindow) {
                this.lastScores.shift();
            }
        }
    }

    getRandomBatch() {
        const batchSize = this.batchSize;
        const regularSize = Math.floor(batchSize * 0.8);  // Увеличиваем долю обычной памяти
        const prioritySize = batchSize - regularSize;
        const batch = [];

        // Оптимизированный выбор из обычной памяти
        if (this.memory.length > 0) {
            const indices = new Array(this.memory.length).fill(0).map((_, i) => i);
            for (let i = 0; i < regularSize && indices.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * indices.length);
                const selectedIndex = indices[randomIndex];
                indices.splice(randomIndex, 1);
                batch.push(this.memory[selectedIndex]);
            }
        }

        // Оптимизированный выбор из приоритетной памяти
        if (this.priorityMemory.length > 0) {
            const indices = new Array(this.priorityMemory.length).fill(0).map((_, i) => i);
            for (let i = 0; i < prioritySize && indices.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * indices.length);
                const selectedIndex = indices[randomIndex];
                indices.splice(randomIndex, 1);
                batch.push(this.priorityMemory[selectedIndex]);
            }
        }

        // Если батч неполный, добавляем из обычной памяти
        while (batch.length < batchSize && this.memory.length > 0) {
            batch.push(this.memory[Math.floor(Math.random() * this.memory.length)]);
        }

        return batch;
    }

    async replay() {
        if (this.memory.length < this.batchSize) return;

        const batch = this.getRandomBatch();
        const states = [];
        const targets = [];
        
        // Обрабатываем каждый опыт последовательно
        for (const exp of batch) {
            const [state, action, reward, nextState, done] = exp;
            const normalizedState = this.normalizeState(state);
            const normalizedNextState = this.normalizeState(nextState);
            const target = this.brain.predict(normalizedState);
            
            if (done) {
                // Ограничиваем масштабирование терминальных наград
                const scaleFactor = Math.min(1.5, 1 + Math.log10(snake.length) / 20);
                target[action] = reward * scaleFactor;
            } else {
                // Используем Double DQN
                const nextQ = this.brain.predict(normalizedNextState);
                const nextAction = nextQ.indexOf(Math.max(...nextQ));
                const futureQ = this.targetBrain.predict(normalizedNextState)[nextAction];
                target[action] = reward + this.gamma * futureQ;
            }
            
            states.push(normalizedState);
            targets.push(target);
        }

        await this.brain.train(states, targets);

        // Обновляем целевую сеть каждые 100 игр
        if (gamesPlayed % 100 === 0) {
            await this.updateTargetNetwork();
        }

        // Обновляем epsilon только после успешного обучения
        this.updateEpsilon();
    }

    updateEpsilon() {
        // Базовое уменьшение epsilon
        if (this.epsilon > this.epsilonMin) {
            this.epsilon *= this.epsilonDecay;
        }

        // Проверяем производительность
        if (this.lastScores.length >= this.scoreWindow) {
            const recentAvg = this.lastScores.slice(-10).reduce((a, b) => a + b, 0) / 10;
            const windowAvg = this.lastScores.reduce((a, b) => a + b, 0) / this.lastScores.length;

            // Если последние результаты хуже средних, увеличиваем epsilon
            if (recentAvg < windowAvg * 0.8) {
                this.epsilon = Math.min(1, this.epsilon * 1.5);
                console.log('Epsilon increased to:', this.epsilon);
            }
        }
    }
}

// Game constants and variables
const GRID_SIZE = 20;
const CELL_SIZE = 20;
let snake, food, direction, score, highScore = 0;
let gameLoopId;
let lastUpdateTime = 0;
let GAME_SPEED = 15; // Frames per second - start slower for better training
let isChartHovered = false;
let lastVisibilityChange = 0;
let movesSinceLastFood = 0; // Добавляем счетчик ходов с момента последней еды

// DOM elements
const gameBoard = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const gamesPlayedElement = document.getElementById('games-played');
const averageScoreElement = document.getElementById('average-score');
const epsilonElement = document.getElementById('epsilon');
const gameLog = document.getElementById('game-log');
const progressChartCanvas = document.getElementById('progress-chart').getContext('2d');

// Initialize AI and game statistics
const ai = new SnakeAI(GRID_SIZE);
let gamesPlayed = 0;
let totalScore = 0;
let gameScores = [];
let progressChart;
let isProcessing = false;
let iterationRewards = {
    food: 0,
    collision: 0,
    distance: 0,
    circling: 0,
    averageImprovement: 0,
    averageDecline: 0,
    averageStagnation: 0,
    noFood: 0 // Добавляем награду за отсутствие еды
};

function logMessage(message) {
    const isScrolledToBottom = gameLog.scrollHeight - gameLog.clientHeight <= gameLog.scrollTop + 1;
    gameLog.value += message + '\n';
    if (isScrolledToBottom) {
    gameLog.scrollTop = gameLog.scrollHeight;
    }
}

function logIterationSummary() {
    const total = iterationRewards.food + iterationRewards.collision + 
                 iterationRewards.distance + iterationRewards.circling +
                 (iterationRewards.averageImprovement || 0) +
                 (iterationRewards.averageDecline || 0) +
                 (iterationRewards.averageStagnation || 0) +
                 (iterationRewards.noFood || 0);
    
    logMessage(`Итерация ${gamesPlayed}: Очки = ${score}, Средний показатель очков = ${(totalScore / gamesPlayed).toFixed(2)}, Эпсилон = ${ai.epsilon.toFixed(3)}`);
    logMessage(`Награды: 🍎 ${iterationRewards.food >= 0 ? '+' : ''}${iterationRewards.food.toFixed(1)} | 📏 ${iterationRewards.distance >= 0 ? '+' : ''}${iterationRewards.distance.toFixed(2)} | 🔄 ${iterationRewards.circling.toFixed(1)} | 💥 ${iterationRewards.collision.toFixed(1)}${
        iterationRewards.averageImprovement ? ` | 📈 +${iterationRewards.averageImprovement.toFixed(2)}` : 
        iterationRewards.averageDecline ? ` | 📉 ${iterationRewards.averageDecline.toFixed(2)}` :
        iterationRewards.averageStagnation ? ` | 📊 ${iterationRewards.averageStagnation.toFixed(2)}` : ''
    }${iterationRewards.noFood ? ` | ⏳ ${iterationRewards.noFood.toFixed(2)}` : ''} | 📊 Итого: ${total.toFixed(2)}`);
    logMessage('─'.repeat(70));
    
    // Сброс наград для следующей итерации
    iterationRewards = {
        food: 0,
        collision: 0,
        distance: 0,
        circling: 0,
        averageImprovement: 0,
        averageDecline: 0,
        averageStagnation: 0,
        noFood: 0
    };
}

function initChart() {
    progressChart = new Chart(progressChartCanvas, {
        type: 'line',
        data: {
            labels: [1, 2, 3, 4, 5, 6],
            datasets: [{
                label: 'Score',
                data: Array(7).fill(null),
                borderColor: '#5eead4',
                tension: 0.1,
                pointRadius: 2,
                pointHoverRadius: 4,
                pointBackgroundColor: 'rgba(94, 234, 212, 0.5)',
                pointBorderColor: '#5eead4',
                pointBorderWidth: 1,
                spanGaps: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'nearest',
                intersect: false,
                axis: 'x'
            },
            scales: {
                y: {
                    beginAtZero: true,
                    min: 0,
                    max: 3,
                    ticks: {
                        stepSize: 1,
                        color: '#9ca3af'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    min: 1,
                    max: 6,
                    ticks: {
                        stepSize: 1,
                        color: '#9ca3af'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#e5e7eb'
                    }
                },
                tooltip: {
                    enabled: true,
                    position: 'nearest',
                    backgroundColor: 'rgba(15, 17, 22, 0.9)',
                    titleColor: '#e5e7eb',
                    bodyColor: '#e5e7eb',
                    borderColor: 'rgba(139, 92, 246, 0.3)',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            const iteration = parseInt(context[0].label);
                            if (iteration % 100 === 0) {
                                return `Итерации ${iteration-99} - ${iteration}`;
                            }
                            return `Итерация ${iteration}`;
                        },
                        label: function(context) {
                            const iteration = parseInt(context.label);
                            if (iteration % 100 === 0) {
                                // Для точек сотен берем самый частый результат за последние 100 игр
                                const hundredScores = gameScores.slice(iteration-100, iteration);
                                const scoreFrequency = {};
                                let maxFreq = 0;
                                let mostFrequentScore = hundredScores[0];
                                
                                // Подсчитываем частоту каждого результата
                                hundredScores.forEach(score => {
                                    scoreFrequency[score] = (scoreFrequency[score] || 0) + 1;
                                    if (scoreFrequency[score] > maxFreq) {
                                        maxFreq = scoreFrequency[score];
                                        mostFrequentScore = score;
                                    }
                                });
                                
                                return `Самый частый результат: ${mostFrequentScore} (${maxFreq} раз)`;
                            } else {
                                // Для обычных точек показываем текущий счет и общее среднее
                                const scores = gameScores.slice(0, iteration);
                                const average = scores.reduce((a, b) => a + b, 0) / scores.length;
                                const currentScore = gameScores[iteration - 1];
                                return `Очки: ${currentScore} | Средний показатель: ${average.toFixed(2)}`;
                            }
                        }
                    }
                }
            },
            onHover: (event, elements) => {
                const wasHovered = isChartHovered;
                isChartHovered = elements && elements.length > 0;
                
                if (wasHovered && !isChartHovered) {
                    updateChart();
                }
            }
        }
    });
}

function updateChart() {
    if (isChartHovered) return;
    
    let chartData = [];
    let labels = [];
    
    if (gameScores.length <= 100) {
        // До 100 итераций показываем все точки
        chartData = [...gameScores];
        labels = gameScores.map((_, i) => i + 1);
    } else {
        // После 100 итераций:
        // 1. Добавляем все предыдущие сотни
        const hundreds = Math.floor(gameScores.length / 100);
        
        for (let h = 1; h <= hundreds; h++) {
            const hundredScores = gameScores.slice((h-1) * 100, h * 100);
            chartData.push(Math.max(...hundredScores));
            labels.push(h * 100);
        }
        
        // 2. Добавляем все точки после последней сотни
        const lastHundred = hundreds * 100;
        for (let i = lastHundred; i < gameScores.length; i++) {
            chartData.push(gameScores[i]);
            labels.push(i + 1);
        }
    }
    
    const maxScore = Math.max(...chartData, 3);
    progressChart.options.scales.y.max = maxScore;
    
    // Настраиваем оси
    const maxGames = Math.max(6, labels[labels.length - 1]);
    progressChart.options.scales.x.max = maxGames;
    progressChart.options.scales.x.min = labels[0];
    
    // Заполняем данные
    progressChart.data.labels = labels;
    progressChart.data.datasets[0].data = chartData;
    
    progressChart.update();
}

function initGame() {
    snake = [
        {x: 10, y: 10},
        {x: 9, y: 10},
        {x: 8, y: 10}
    ];
    direction = 'right';
    score = 0;
    movesSinceLastFood = 0; // Сбрасываем счетчик при начале новой игры
    generateFood();
    updateScore();
    lastUpdateTime = 0;
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
    if (isProcessing) return;
    isProcessing = true;
    
    try {
        const state = ai.getState(snake, food);
        const action = ai.getAction(state);
        const oldDistance = Math.abs(snake[0].x - food.x) + Math.abs(snake[0].y - food.y);

        // Convert action to direction
        let newDirection;
        if (action === 0) { // Left
            newDirection = direction === 'up' ? 'left' : 
                            direction === 'left' ? 'down' : 
                            direction === 'down' ? 'right' : 'up';
        } else if (action === 1) { // Forward
            newDirection = direction;
        } else { // Right
            newDirection = direction === 'up' ? 'right' : 
                          direction === 'right' ? 'down' : 
                          direction === 'down' ? 'left' : 'up';
        }
        
        direction = newDirection;

        const head = {...snake[0]};
        switch(direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // Разделяем проверку столкновений на два типа
        const wallCollision = head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE;
        const tailCollision = snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y);

        if (wallCollision || tailCollision) {
            gamesPlayed++;
            
            // Вычисляем старый средний показатель
            const oldAverage = totalScore / (gamesPlayed - 1);
            totalScore += score;
            // Вычисляем новый средний показатель
            const newAverage = totalScore / gamesPlayed;
            
            // Награда/штраф за изменение среднего показателя
            let averageChangeReward = 0;
            if (gamesPlayed > 1) {
                const averageChange = newAverage - oldAverage;
                const STAGNATION_THRESHOLD = 0.1; // Увеличиваем порог стагнации
                
                if (Math.abs(averageChange) < STAGNATION_THRESHOLD) {
                    // Уменьшаем штраф за стагнацию
                    averageChangeReward = -0.2;
                    iterationRewards.averageStagnation = averageChangeReward;
                } else if (averageChange > 0) {
                    // Увеличиваем награду за улучшение
                    averageChangeReward = averageChange * 3;
                    iterationRewards.averageImprovement = averageChangeReward;
                } else {
                    // Смягчаем штраф за ухудшение
                    averageChangeReward = averageChange;
                    iterationRewards.averageDecline = averageChangeReward;
                }
            }
            
            let collisionPenalty;
            if (tailCollision) {
                // Делаем штраф за хвост зависимым от длины, но с ограничением
                collisionPenalty = -1 - Math.min(2, (snake.length - 3) * 0.2);
            } else {
                // Фиксированный штраф за стену
                collisionPenalty = -1;
            }
            
            iterationRewards.collision += collisionPenalty;
            
            logIterationSummary();
            gameScores.push(score);
            updateChart();

            const nextState = ai.getState(snake, food);
            ai.remember(state, action, collisionPenalty + averageChangeReward, nextState, true);
            
            // Обновляем нормализацию
            ai.updateNormalization(score, snake.length);
            
            // Обучаем только каждые 5 игр на ранних этапах
            if (gamesPlayed < 100 && gamesPlayed % 5 === 0 || gamesPlayed % 20 === 0) {
                await ai.replay();
            }
            
            initGame();
            return;
        }

        snake.unshift(head);
        movesSinceLastFood++;

        const newDistance = Math.abs(head.x - food.x) + Math.abs(head.y - food.y);
        let reward = 0;
        
        if (head.x === food.x && head.y === food.y) {
            score++;
            updateScore();
            generateFood();
            movesSinceLastFood = 0;
            
            // Базовая награда за еду
            const baseReward = 1;
            // Бонус за эффективность (меньше ходов - больше награда)
            const efficiencyBonus = Math.max(0, (50 - movesSinceLastFood) / 50);
            // Прогрессивная награда за длину
            const lengthBonus = Math.min(0.5, (snake.length - 3) * 0.1);
            
            reward = baseReward + efficiencyBonus + lengthBonus;
            iterationRewards.food += reward;
        } else {
            snake.pop();
            
            // Увеличиваем награду за приближение к еде
            const distanceReward = (oldDistance - newDistance) * 0.1;
            reward += distanceReward;
            iterationRewards.distance += distanceReward;
            
            // Штраф за отсутствие еды
            if (movesSinceLastFood > 50) {
                const noFoodPenalty = -0.005 * (movesSinceLastFood - 50);
                reward += noFoodPenalty;
                iterationRewards.noFood += noFoodPenalty;
            }
            
            // Определение кружения
            const lastPositions = snake.slice(0, Math.min(10, snake.length));
            const positionHistory = lastPositions.map(pos => `${pos.x},${pos.y}`);
            const uniquePositions = new Set(positionHistory);
            const uniqueRatio = uniquePositions.size / lastPositions.length;
            
            // Смягчаем штраф за кружение
            if (uniqueRatio < 0.7) {
                const circlingPenalty = -0.1 * (1 - uniqueRatio);
                reward += circlingPenalty;
                iterationRewards.circling += circlingPenalty;
            }
        }

        const nextState = ai.getState(snake, food);
        ai.remember(state, action, reward, nextState, false);

        // Убираем обучение во время игры
        renderGame();
    } finally {
        isProcessing = false;
    }
}

function runGameLoop(timestamp) {
    gameLoopId = requestAnimationFrame(runGameLoop);
    
    // Если вкладка была неактивна, сбрасываем lastUpdateTime
    if (timestamp - lastUpdateTime > 1000) {
        lastUpdateTime = timestamp - (1000 / GAME_SPEED);
    }
    
    // Control game speed using timestamp
    const interval = 1000 / GAME_SPEED; // milliseconds per frame
    if (timestamp - lastUpdateTime >= interval) {
        lastUpdateTime = timestamp;
        updateGame();
    }
}

function renderGame() {
    gameBoard.innerHTML = '';
    snake.forEach((segment, index) => {
        const snakeElement = document.createElement('div');
        snakeElement.style.gridRowStart = segment.y + 1;
        snakeElement.style.gridColumnStart = segment.x + 1;
        snakeElement.classList.add(index === 0 ? 'snake-head' : 'snake-segment');
        gameBoard.appendChild(snakeElement);
    });

    const foodElement = document.createElement('div');
    foodElement.style.gridRowStart = food.y + 1;
    foodElement.style.gridColumnStart = food.x + 1;
    foodElement.classList.add('food');
    gameBoard.appendChild(foodElement);
}

function updateScore() {
    scoreElement.textContent = score;
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
    }
    gamesPlayedElement.textContent = gamesPlayed;
    if (gamesPlayed > 0) {
        averageScoreElement.textContent = (totalScore / gamesPlayed).toFixed(2);
    }
    epsilonElement.textContent = ai.epsilon.toFixed(3);
}

// Set up the grid
gameBoard.style.gridTemplateColumns = `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`;
gameBoard.style.gridTemplateRows = `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`;

// Event listeners
document.getElementById('save-model').addEventListener('click', () => ai.saveModel());
document.getElementById('load-model').addEventListener('click', () => ai.loadModel());

const speedSlider = document.getElementById("speed-slider");
const speedValue = document.getElementById("speed-value");

function updateSliderProgress(slider) {
    const progress = (slider.value - slider.min) / (slider.max - slider.min) * 100;
    slider.style.setProperty('--range-progress', `${progress}%`);
}

speedSlider.addEventListener("input", function (event) {
    GAME_SPEED = parseInt(event.target.value, 10);
    speedValue.textContent = GAME_SPEED;
    updateSliderProgress(this);
});

// Initialize slider progress and value
GAME_SPEED = parseInt(speedSlider.value, 10);
speedValue.textContent = GAME_SPEED;
updateSliderProgress(speedSlider);

// Add copy log functionality
document.getElementById('copy-log').addEventListener('click', async () => {
    const log = document.getElementById('game-log');
    const button = document.getElementById('copy-log');
    const tooltip = document.querySelector('.copy-tooltip');
    
    try {
        await navigator.clipboard.writeText(log.value);
        button.style.color = getComputedStyle(document.documentElement).getPropertyValue('--primary-hover');
        tooltip.classList.add('show');
        
        setTimeout(() => {
            button.style.color = '';
            tooltip.classList.remove('show');
        }, 1500);
    } catch (err) {
        console.error('Failed to copy log:', err);
    }
});

// Initialize the game
initChart();
initGame();

// Add chart mouseleave handler
progressChartCanvas.canvas.addEventListener('mouseleave', () => {
    progressChart.tooltip.setActiveElements([], { x: 0, y: 0 });
    isChartHovered = false;
    updateChart();
    progressChart.update();
});

// Обновление кастомного скроллбара
function updateCustomScrollbar() {
    const scrollTop = gameLog.scrollTop;
    const scrollHeight = gameLog.scrollHeight;
    const clientHeight = gameLog.clientHeight;
    
    const thumb = document.querySelector('.scrollbar-thumb');
    const trackHeight = document.querySelector('.scrollbar-track').clientHeight;
    
    // Вычисляем высоту ползунка
    const thumbHeight = Math.max(
        30,
        (clientHeight / scrollHeight) * trackHeight
    );
    
    // Вычисляем позицию ползунка
    const scrollRange = scrollHeight - clientHeight;
    const thumbRange = trackHeight - thumbHeight;
    const thumbPosition = (scrollTop / scrollRange) * thumbRange;
    
    thumb.style.height = `${thumbHeight}px`;
    thumb.style.top = `${thumbPosition}px`;
}

// Добавляем обработчики событий
gameLog.addEventListener('scroll', updateCustomScrollbar);
new ResizeObserver(updateCustomScrollbar).observe(gameLog);

// Инициализация скроллбара
updateCustomScrollbar();

// Добавляем обработчик видимости страницы
document.addEventListener('visibilitychange', () => {
    const now = performance.now();
    if (!document.hidden) {
        // Сбрасываем lastUpdateTime при возврате на вкладку
        lastUpdateTime = now;
    }
    lastVisibilityChange = now;
});