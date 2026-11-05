class ImageOptimizer {
    constructor() {
        this.images = new Map();
        this.dropZone = document.querySelector('.drop-zone');
        this.fileInput = document.querySelector('#file-input');
        this.previewContainer = document.querySelector('.preview-container');
        this.jsonOutput = document.querySelector('#json-output');
        this.maxSizeInput = document.querySelector('#max-size');
        this.qualityInput = document.querySelector('#quality');
        this.draggedItem = null;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Drag and drop handlers for file upload
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('drag-over');
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('drag-over');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        });

        // File input handler
        this.fileInput.addEventListener('change', () => {
            this.handleFiles(this.fileInput.files);
        });

        // Settings change handlers
        this.maxSizeInput.addEventListener('change', () => this.updateAllPreviews());
        this.qualityInput.addEventListener('change', () => this.updateAllPreviews());

        // Button handlers
        document.querySelector('#download-all').addEventListener('click', () => this.downloadAll());
        document.querySelector('#clear-all').addEventListener('click', () => this.clearAll());
        document.querySelector('#copy-json').addEventListener('click', () => this.copyJson());
    }

    async handleFiles(files) {
        const totalFiles = files.length;
        let processedFiles = 0;
        
        // Создаем общий индикатор прогресса
        const progress = document.createElement('div');
        progress.className = 'progress-bar fixed';
        progress.innerHTML = `
            <div class="progress-text">Общий прогресс: 0/${totalFiles}</div>
            <div class="progress-line">
                <div class="progress-fill"></div>
            </div>
        `;
        document.body.appendChild(progress);

        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                processedFiles++;
                continue;
            }

            // Создаем предварительный элемент для изображения
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.setAttribute('data-filename', file.name);
            
            // Добавляем индивидуальный прогресс-бар
            const individualProgress = document.createElement('div');
            individualProgress.className = 'progress-bar';
            individualProgress.innerHTML = `
                <div class="progress-text">Конвертация: ${file.name}</div>
                <div class="progress-line">
                    <div class="progress-fill"></div>
                </div>
            `;
            previewItem.appendChild(individualProgress);
            this.previewContainer.appendChild(previewItem);

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    // Обновляем индивидуальный прогресс до 50%
                    individualProgress.querySelector('.progress-fill').style.width = '50%';
                    individualProgress.querySelector('.progress-text').textContent = `Оптимизация: ${file.name}`;

                    const originalImage = await this.loadImage(e.target.result);
                    const optimizedImage = await this.optimizeImage(originalImage, file.name);
                    
                    this.images.set(file.name, {
                        original: {
                            size: file.size,
                            data: e.target.result
                        },
                        optimized: optimizedImage
                    });

                    // Сразу обновляем превью и JSON
                    this.updatePreview(file.name);
                    this.updateJsonOutput();
                    
                    processedFiles++;
                    // Обновляем общий прогресс
                    const percent = (processedFiles / totalFiles) * 100;
                    progress.querySelector('.progress-text').textContent = `Общий прогресс: ${processedFiles}/${totalFiles}`;
                    progress.querySelector('.progress-fill').style.width = `${percent}%`;
                    
                    // Удаляем общий индикатор прогресса, когда все файлы обработаны
                    if (processedFiles === totalFiles) {
                        setTimeout(() => progress.remove(), 1000);
                    }
                } catch (error) {
                    console.error('Ошибка при обработке изображения:', error);
                    previewItem.remove();
                }
            };
            reader.readAsDataURL(file);
        }
    }

    loadImage(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = src;
        });
    }

    async optimizeImage(img, filename) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set initial dimensions
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image
        ctx.drawImage(img, 0, 0);
        
        let quality = this.qualityInput.value / 100;
        let maxSize = this.maxSizeInput.value * 1024; // Convert to bytes
        let optimized = canvas.toDataURL('image/jpeg', quality);
        
        // Binary search for optimal quality to meet size target
        while (this.getDataUrlSize(optimized) > maxSize && quality > 0.1) {
            quality *= 0.9;
            optimized = canvas.toDataURL('image/jpeg', quality);
        }
        
        return {
            data: optimized,
            size: this.getDataUrlSize(optimized),
            width: img.width,
            height: img.height
        };
    }

    getDataUrlSize(dataUrl) {
        const base64 = dataUrl.split(',')[1];
        return Math.floor(base64.length * 0.75); // Approximate size in bytes
    }

    updatePreview(filename) {
        const imageData = this.images.get(filename);
        if (!imageData) return;

        const existingPreview = document.querySelector(`[data-filename="${filename}"]`);
        if (existingPreview) {
            // Создаем новый элемент превью
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.setAttribute('data-filename', filename);
            previewItem.draggable = true;

            const img = document.createElement('img');
            img.src = imageData.optimized.data;
            img.alt = filename;

            const info = document.createElement('div');
            info.className = 'preview-info';
            info.innerHTML = `
                <div>Имя: <strong>${filename}</strong></div>
                <div>Оригинальный размер: <strong>${(imageData.original.size / 1024).toFixed(1)} KB</strong></div>
                <div>Оптимизированный размер: <strong>${(imageData.optimized.size / 1024).toFixed(1)} KB</strong></div>
                <div>Размеры: <strong>${imageData.optimized.width}x${imageData.optimized.height}</strong></div>
            `;

            const actions = document.createElement('div');
            actions.className = 'preview-actions';
            actions.innerHTML = `
                <button class="btn" onclick="optimizer.downloadImage('${filename}')">Скачать</button>
                <button class="btn btn-secondary" onclick="optimizer.removeImage('${filename}')">Удалить</button>
            `;

            previewItem.appendChild(img);
            previewItem.appendChild(info);
            previewItem.appendChild(actions);

            // Добавляем обработчики drag and drop
            this.addDragAndDropHandlers(previewItem);

            // Заменяем старый элемент на новый
            existingPreview.replaceWith(previewItem);

            // Добавляем имя файла в JSON только когда картинка готова
            this.addToJson(filename);
        }
    }

    addToJson(filename) {
        const currentJson = JSON.parse(this.jsonOutput.textContent);
        if (!currentJson.includes(filename)) {
            currentJson.push(filename);
            this.jsonOutput.textContent = JSON.stringify(currentJson, null, 2);
        }
    }

    addDragAndDropHandlers(previewItem) {
        previewItem.addEventListener('dragstart', (e) => {
            this.draggedItem = previewItem;
            previewItem.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';

            const dragPreview = previewItem.cloneNode(true);
            dragPreview.style.width = `${previewItem.offsetWidth}px`;
            dragPreview.classList.add('drag-preview');
            document.body.appendChild(dragPreview);
            
            e.dataTransfer.setDragImage(dragPreview, 20, 20);

            requestAnimationFrame(() => {
                dragPreview.remove();
            });
        });

        previewItem.addEventListener('dragend', () => {
            previewItem.classList.remove('dragging');
            this.draggedItem = null;
            this.updateJsonOutput();
        });

        previewItem.addEventListener('dragenter', (e) => {
            e.preventDefault();
            if (previewItem !== this.draggedItem) {
                previewItem.classList.add('drag-over');
            }
        });

        previewItem.addEventListener('dragleave', (e) => {
            const rect = previewItem.getBoundingClientRect();
            const x = e.clientX;
            const y = e.clientY;
            
            if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
                previewItem.classList.remove('drag-over');
            }
        });

        previewItem.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            if (previewItem !== this.draggedItem) {
                const rect = previewItem.getBoundingClientRect();
                const x = e.clientX;
                const y = e.clientY;
                
                if (x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom) {
                    previewItem.classList.add('drag-over');
                }
            }
        });

        previewItem.addEventListener('drop', (e) => {
            e.preventDefault();
            previewItem.classList.remove('drag-over');
            
            if (previewItem !== this.draggedItem) {
                const dropTarget = previewItem.closest('.preview-item');
                if (dropTarget && this.draggedItem) {
                    const draggedNext = this.draggedItem.nextElementSibling;
                    const dropNext = dropTarget.nextElementSibling;
                    
                    if (draggedNext === dropTarget) {
                        dropTarget.parentNode.insertBefore(dropTarget, this.draggedItem);
                    } else if (dropNext === this.draggedItem) {
                        dropTarget.parentNode.insertBefore(this.draggedItem, dropTarget);
                    } else {
                        const draggedPlace = document.createComment('');
                        this.draggedItem.parentNode.insertBefore(draggedPlace, this.draggedItem);
                        dropTarget.parentNode.insertBefore(this.draggedItem, dropTarget);
                        draggedPlace.parentNode.insertBefore(dropTarget, draggedPlace);
                        draggedPlace.remove();
                    }
                    
                    this.updateJsonOutput();
                }
            }
        });
    }

    updateAllPreviews() {
        for (const [filename, imageData] of this.images.entries()) {
            this.loadImage(imageData.original.data).then(img => {
                this.optimizeImage(img, filename).then(optimized => {
                    imageData.optimized = optimized;
                    this.updatePreview(filename);
                    this.updateJsonOutput();
                });
            });
        }
    }

    updateJsonOutput() {
        // Этот метод теперь используется только для обновления порядка элементов
        const gallery = Array.from(this.previewContainer.querySelectorAll('.preview-item'))
            .map(item => item.getAttribute('data-filename'))
            .filter(filename => this.images.has(filename)); // Убеждаемся, что файл существует
        this.jsonOutput.textContent = JSON.stringify(gallery, null, 2);
    }

    async downloadImage(filename) {
        const imageData = this.images.get(filename);
        if (!imageData) return;

        const link = document.createElement('a');
        link.href = imageData.optimized.data;
        link.download = filename;
        link.click();
    }

    async downloadAll() {
        for (const filename of this.images.keys()) {
            await this.downloadImage(filename);
        }
    }

    removeImage(filename) {
        this.images.delete(filename);
        const preview = document.querySelector(`[data-filename="${filename}"]`);
        if (preview) {
            preview.remove();
            // Удаляем файл из JSON при удалении изображения
            const currentJson = JSON.parse(this.jsonOutput.textContent);
            const index = currentJson.indexOf(filename);
            if (index > -1) {
                currentJson.splice(index, 1);
                this.jsonOutput.textContent = JSON.stringify(currentJson, null, 2);
            }
        }
    }

    clearAll() {
        this.images.clear();
        this.previewContainer.innerHTML = '';
        this.jsonOutput.textContent = '[]';
        this.fileInput.value = '';
    }

    copyJson() {
        navigator.clipboard.writeText(this.jsonOutput.textContent)
            .then(() => alert('JSON скопирован в буфер обмена'))
            .catch(err => console.error('Ошибка при копировании:', err));
    }
}

// Initialize the optimizer when the page loads
const optimizer = new ImageOptimizer(); 