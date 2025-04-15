class LoadingScreen {
    constructor(game) {
        this.game = game;
        this.progress = 0;
        this.totalSteps = 4;
        this.currentStep = 0;
        this.loadingText = 'Загрузка';
        this.dots = '..........'; // Обычные точки
        this.bigDotPosition = 0;
        this.lastDotTime = 0;
        this.dotInterval = 100;

        // Создаём элемент загрузочного экрана
        this.element = document.createElement('div');
        this.element.id = 'loadingScreen';
        this.element.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #1E1E2E;
            display: none;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: 'Press Start 2P', monospace;
            color: #f2f2f9;
        `;

        // Создаём элемент для текста
        this.textElement = document.createElement('div');
        this.textElement.style.cssText = `
            font-size: 24px;
            margin-bottom: 20px;
        `;

        // Создаём элемент для точек
        this.dotsElement = document.createElement('div');
        this.dotsElement.style.cssText = `
            margin-bottom: 50px;
            letter-spacing: 10px;
        `;

        // Создаём контейнер для прогресс-бара
        this.progressContainer = document.createElement('div');
        this.progressContainer.style.cssText = `
            width: 300px;
            height: 20px;
            background: #2A2A3A;
            border: 2px solid #353545;
            position: relative;
            margin-bottom: 20px;
        `;

        // Создаём сам прогресс-бар
        this.progressBar = document.createElement('div');
        this.progressBar.style.cssText = `
            width: 0%;
            height: 100%;
            background: #6a5fa0;
            transition: width 0.3s ease;
        `;
        this.progressContainer.appendChild(this.progressBar);

        // Создаём элемент для процентов
        this.percentElement = document.createElement('div');
        this.percentElement.style.cssText = `
            font-size: 16px;
            margin-bottom: 50px;
        `;

        // Создаём элемент для отображения этапа
        this.stageElement = document.createElement('div');
        this.stageElement.style.cssText = `
            font-size: 14px;
            color: #666666;
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
        `;

        // Собираем всё вместе
        this.element.appendChild(this.textElement);
        this.element.appendChild(this.dotsElement);
        this.element.appendChild(this.progressContainer);
        this.element.appendChild(this.percentElement);
        this.element.appendChild(this.stageElement);
        document.body.appendChild(this.element);

        // Устанавливаем начальный текст
        this.textElement.textContent = this.loadingText;
        this.updateDots();
    }

    updateProgress(step) {
        this.currentStep = step;
        this.progress = (step / this.totalSteps) * 100;
        this.progressBar.style.width = this.progress + '%';
        this.percentElement.textContent = Math.round(this.progress) + '%';

        // Обновляем текст этапа
        switch(step) {
            case 0:
                this.stageElement.textContent = 'Загрузка glyphs.json';
                break;
            case 1:
                this.stageElement.textContent = 'Загрузка maps.json';
                break;
            case 2:
                this.stageElement.textContent = 'Загрузка items.json';
                break;
            case 3:
                this.stageElement.textContent = 'Загрузка файлов глифов';
                break;
            case 4:
                this.stageElement.textContent = 'Загрузка завершена';
                break;
        }
    }

    show() {
        this.element.style.display = 'flex';
    }

    hide() {
        this.element.style.display = 'none';
    }

    updateDots() {
        let dotsHtml = '';
        for (let i = 0; i < this.dots.length; i++) {
            if (i === this.bigDotPosition) {
                dotsHtml += `<span style="font-size: 24px">.</span>`;
            } else {
                dotsHtml += `<span style="font-size: 16px">.</span>`;
            }
        }
        this.dotsElement.innerHTML = dotsHtml;
    }

    render() {
        // Обновляем анимацию точек
        const now = performance.now();
        if (now - this.lastDotTime > this.dotInterval) {
            this.bigDotPosition = (this.bigDotPosition + 1) % this.dots.length;
            this.updateDots();
            this.lastDotTime = now;
        }
    }
} 