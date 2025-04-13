class InventorySystem {
    constructor(game) {
        this.game = game;
        this.items = [];
        this.equipped = {
            weapon: null,
            helmet: null,
            armor: null,
            legs: null
        };
        this.selectedItemIndex = 0;
        this.selectedActionIndex = 0;
        this.isOpen = false;
        this.actionMenuOpen = false;
        this.showingDetails = false;
        this.currentPage = 0;
        this.loadItems();
    }

    async loadItems() {
        const response = await fetch('src/data/items.json');
        const data = await response.json();
        this.itemsData = data.items;
        
        // Экипируем начальные предметы
        this.addItem('rusty_sword');
        this.addItem('leather_helmet');
        this.addItem('leather_armor');
        this.addItem('leather_pants');
        
        this.equipItem(0); // Меч
        this.equipItem(1); // Шлем
        this.equipItem(2); // Броня
        this.equipItem(3); // Штаны
    }

    addItem(itemId) {
        const itemData = this.itemsData[itemId];
        if (itemData) {
            this.items.push({
                id: itemId,
                ...itemData
            });
        }
    }

    equipItem(index) {
        const item = this.items[index];
        if (item) {
            // Если в этом слоте уже что-то надето, снимаем
            if (this.equipped[item.type]) {
                this.equipped[item.type].isEquipped = false;
            }
            item.isEquipped = true;
            this.equipped[item.type] = item;
        }
    }

    unequipItem(index) {
        const item = this.items[index];
        if (item && item.isEquipped) {
            item.isEquipped = false;
            this.equipped[item.type] = null;
        }
    }

    dropItem(index) {
        if (index >= 0 && index < this.items.length) {
            const item = this.items[index];
            if (item.isEquipped) {
                this.unequipItem(index);
            }
            this.items.splice(index, 1);
            if (this.selectedItemIndex >= this.items.length) {
                this.selectedItemIndex = Math.max(0, this.items.length - 1);
            }
        }
    }

    toggleInventory() {
        this.isOpen = !this.isOpen;
        this.actionMenuOpen = false;
        this.showingDetails = false;
        this.selectedItemIndex = 0;
        this.currentPage = 0;
    }

    moveSelection(direction) {
        if (this.actionMenuOpen) {
            // Перемещаем выбор в меню действий
            const item = this.getSelectedItem();
            const actions = [
                item.isEquipped ? 'Снять' : 'Экипировать',
                'Выбросить',
                'Подробности'
            ];
            
            this.selectedActionIndex += direction;
            if (this.selectedActionIndex < 0) {
                this.selectedActionIndex = actions.length - 1;
            } else if (this.selectedActionIndex >= actions.length) {
                this.selectedActionIndex = 0;
            }
        } else {
            // Перемещаем выбор в списке предметов
            const itemsPerPage = this.getItemsPerPage();
            const startIndex = this.currentPage * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, this.items.length);
            const pageItems = endIndex - startIndex;

            this.selectedItemIndex += direction;

            // Если вышли за пределы текущей страницы вверх
            if (this.selectedItemIndex < startIndex) {
                if (this.currentPage > 0) {
                    // Переходим на предыдущую страницу
                    this.currentPage--;
                    this.selectedItemIndex = (this.currentPage + 1) * itemsPerPage - 1;
                } else {
                    // Переходим в конец списка
                    const lastPage = Math.floor((this.items.length - 1) / itemsPerPage);
                    this.currentPage = lastPage;
                    this.selectedItemIndex = this.items.length - 1;
                }
            }
            // Если вышли за пределы текущей страницы вниз
            else if (this.selectedItemIndex >= endIndex) {
                if (endIndex < this.items.length) {
                    // Переходим на следующую страницу
                    this.currentPage++;
                    this.selectedItemIndex = this.currentPage * itemsPerPage;
                } else {
                    // Переходим в начало списка
                    this.currentPage = 0;
                    this.selectedItemIndex = 0;
                }
            }
        }
    }

    getItemsPerPage() {
        // Вычисляем доступное пространство для списка предметов
        const startY = 290; // Начальная Y-координата списка
        const bottomMargin = 40; // Отступ снизу
        const itemHeight = 30; // Высота одного предмета
        const availableHeight = 500 - startY - bottomMargin; // 500 - высота инвентаря
        
        // Вычисляем максимальное количество предметов на странице
        return Math.floor(availableHeight / itemHeight);
    }

    toggleActionMenu() {
        if (this.items.length > 0) {
            if (!this.actionMenuOpen) {
                this.actionMenuOpen = true;
                this.selectedActionIndex = 0;
                this.showingDetails = false;
            } else {
                // Выполняем выбранное действие
                const item = this.getSelectedItem();
                switch (this.selectedActionIndex) {
                    case 0: // Экипировать/Снять
                        if (item.isEquipped) {
                            this.unequipItem(this.selectedItemIndex);
                        } else {
                            this.equipItem(this.selectedItemIndex);
                        }
                        this.actionMenuOpen = false;
                        break;
                    case 1: // Выбросить
                        this.dropItem(this.selectedItemIndex);
                        this.actionMenuOpen = false;
                        break;
                    case 2: // Подробности
                        this.showingDetails = true;
                        this.actionMenuOpen = false; // Закрываем меню действий при открытии подробностей
                        break;
                }
            }
        }
    }

    getSelectedItem() {
        return this.items[this.selectedItemIndex];
    }

    // Метод для получения строки характеристик предмета
    getItemStats(item) {
        let stats = '';
        if (item.damage) {
            stats = `[${item.damage}]`;
        } else if (item.defense) {
            stats = `[${item.defense}]`;
        }
        return stats;
    }

    render(ctx) {
        if (!this.isOpen) return;

        // Базовые размеры окна
        let width = 500;
        const height = 500;
        
        // Настраиваем контекст для измерения текста
        ctx.font = '12px "Press Start 2P"';
        
        // Проверяем размеры для экипированных предметов
        const slotNames = {
            weapon: 'Оружие:',
            helmet: 'Шлем:',
            armor: 'Броня:',
            legs: 'Штаны:'
        };

        // Минимальная ширина для слотов
        const minSlotWidth = 120;  // Для названия слота
        const minItemWidth = 200;  // Для названия предмета
        const minStatsWidth = 100; // Для характеристик
        const padding = 40;        // Отступы слева и справа
        
        // Находим максимальную необходимую ширину
        let maxWidth = width;
        
        // Проверяем экипированные предметы
        Object.entries(this.equipped).forEach(([slot, item]) => {
            if (item) {
                const slotWidth = ctx.measureText(slotNames[slot]).width;
                const itemWidth = ctx.measureText(item.name).width;
                const stats = this.getItemStats(item);
                const statsWidth = stats ? ctx.measureText(stats).width : 0;
                
                const totalWidth = padding + slotWidth + minSlotWidth + itemWidth + statsWidth + padding;
                maxWidth = Math.max(maxWidth, totalWidth);
            }
        });
        
        // Проверяем предметы в инвентаре
        this.items.forEach(item => {
            const itemWidth = ctx.measureText(item.name + (item.isEquipped ? ' [E]' : '')).width;
            const stats = this.getItemStats(item);
            const statsWidth = stats ? ctx.measureText(stats).width : 0;
            
            const totalWidth = padding + 20 + itemWidth + statsWidth + padding;
            maxWidth = Math.max(maxWidth, totalWidth);
        });
        
        // Обновляем ширину окна если нужно
        width = maxWidth;

        const x = (ctx.canvas.width - width) / 2;
        const y = (ctx.canvas.height - height) / 2;

        // Фон инвентаря
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(x, y, width, height);
        
        // Рамка
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Заголовок
        ctx.font = '20px "Press Start 2P"';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('ИНВЕНТАРЬ', x + width/2, y + 40);

        // Отрисовка экипированных предметов
        let equipY = y + 80;
        const labelX = x + padding;
        const valueX = x + padding + 120;
        const statsX = x + width - padding - 60;

        Object.entries(this.equipped).forEach(([slot, item]) => {
            // Название слота
            ctx.font = '12px "Press Start 2P"';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'left';
            ctx.fillText(slotNames[slot], labelX, equipY);

            // Название предмета
            if (item) {
                ctx.fillStyle = '#fff';
                ctx.fillText(item.name, valueX, equipY);

                // Характеристики предмета
                const stats = this.getItemStats(item);
                if (stats) {
                    ctx.fillStyle = '#888';
                    ctx.textAlign = 'right';
                    ctx.fillText(stats, statsX, equipY);
                    ctx.textAlign = 'left';
                }
            } else {
                ctx.fillStyle = '#444';
                ctx.fillText('(пусто)', valueX, equipY);
            }
            equipY += 30;
        });

        // Разделитель
        const dividerY = y + 230;
        ctx.strokeStyle = '#444';
        ctx.beginPath();
        ctx.moveTo(x + padding, dividerY);
        ctx.lineTo(x + width - padding, dividerY);
        ctx.stroke();

        // Список предметов
        ctx.font = '12px "Press Start 2P"';
        ctx.fillStyle = '#888';
        ctx.textAlign = 'left';
        ctx.fillText('Предметы:', x + padding, dividerY + 30);

        const itemsStartY = dividerY + 60;
        const itemsPerPage = Math.floor((height - (itemsStartY - y) - 40) / 30);
        const startIndex = this.currentPage * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, this.items.length);

        // Отображаем предметы текущей страницы
        for (let i = startIndex; i < endIndex; i++) {
            const item = this.items[i];
            const itemY = itemsStartY + (i - startIndex) * 30;

            // Стрелка выбора
            if (i === this.selectedItemIndex) {
                ctx.fillStyle = '#fff';
                ctx.fillText('>', x + padding - 15, itemY);
            }

            // Название предмета
            ctx.fillStyle = '#fff';
            const itemName = item.name + (item.isEquipped ? ' [E]' : '');
            ctx.fillText(itemName, x + padding, itemY);

            // Характеристики предмета
            const stats = this.getItemStats(item);
            if (stats) {
                ctx.fillStyle = '#888';
                ctx.textAlign = 'right';
                ctx.fillText(stats, statsX, itemY);
                ctx.textAlign = 'left';
            }
        }

        // Номер страницы
        const totalPages = Math.ceil(this.items.length / itemsPerPage);
        if (totalPages > 1) {
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText(`Страница ${this.currentPage + 1}/${totalPages}`, x + width/2, y + height - 20);
        }

        // Меню действий
        if (this.actionMenuOpen && this.items.length > 0) {
            const item = this.getSelectedItem();
            const actions = [
                item.isEquipped ? 'Снять' : 'Экипировать',
                'Выбросить',
                'Подробности'
            ];

            const menuWidth = 160;
            const menuHeight = actions.length * 30 + 10;
            const menuX = x + width - menuWidth - 20;
            const menuY = itemsStartY + (this.selectedItemIndex - startIndex) * 30 - 15;

            // Фон меню
            ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
            ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
            
            // Рамка меню
            ctx.strokeStyle = '#444';
            ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

            // Пункты меню
            actions.forEach((action, index) => {
                ctx.fillStyle = index === this.selectedActionIndex ? '#fff' : '#888';
                ctx.textAlign = 'left';
                const actionY = menuY + 20 + index * 30;
                if (index === this.selectedActionIndex) {
                    ctx.fillText('>', menuX + 10, actionY);
                }
                ctx.fillText(action, menuX + 30, actionY);
            });
        }

        // Окно подробностей
        if (this.showingDetails && this.items.length > 0) {
            const item = this.getSelectedItem();
            
            // Затемнение
            ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
            ctx.fillRect(x, y, width, height);
            ctx.strokeStyle = '#666';
            ctx.strokeRect(x, y, width, height);

            const padding = 40;
            const contentWidth = width - padding * 2;

            // Название предмета
            ctx.font = '16px "Press Start 2P"';
            ctx.fillStyle = '#ffd700';
            ctx.textAlign = 'center';
            const titleLines = this.wrapText(ctx, item.name, contentWidth);
            let currentY = y + 80;
            
            titleLines.forEach(line => {
                ctx.fillText(line, x + width/2, currentY);
                currentY += 30;
            });

            // Характеристики предмета
            const stats = this.getItemStats(item);
            if (stats) {
                ctx.font = '12px "Press Start 2P"';
                ctx.fillStyle = '#888';
                ctx.fillText(stats, x + width/2, currentY + 20);
                currentY += 50;
            }

            // Описание предмета
            ctx.font = '12px "Press Start 2P"';
            ctx.fillStyle = '#fff';
            const descriptionLines = this.wrapText(ctx, item.description, contentWidth);
            
            // Проверяем, сколько строк поместится до нижней кнопки
            const bottomButtonY = y + height - 40;
            const maxLines = Math.floor((bottomButtonY - currentY) / 30);
            
            descriptionLines.slice(0, maxLines).forEach(line => {
                ctx.fillText(line, x + width/2, currentY);
                currentY += 30;
            });

            // Кнопка закрытия
            ctx.fillStyle = '#666';
            ctx.fillText('Нажмите Space чтобы закрыть', x + width/2, bottomButtonY);
        }
    }

    changePage(direction) {
        const itemsPerPage = this.getItemsPerPage();
        const totalPages = Math.ceil(this.items.length / itemsPerPage);
        
        this.currentPage += direction;
        
        // Циклическое переключение страниц
        if (this.currentPage < 0) {
            this.currentPage = totalPages - 1;
        } else if (this.currentPage >= totalPages) {
            this.currentPage = 0;
        }
        
        // Устанавливаем курсор на первый предмет новой страницы
        this.selectedItemIndex = this.currentPage * itemsPerPage;
        
        // Если на последней странице вышли за пределы списка
        if (this.selectedItemIndex >= this.items.length) {
            this.selectedItemIndex = this.items.length - 1;
        }
    }

    handleKeyPress(key) {
        if (!this.isOpen) return;

        // Если открыто окно подробностей, обрабатываем только пробел
        if (this.showingDetails) {
            if (key === ' ') { // Space
                this.showingDetails = false;
                this.actionMenuOpen = false;
            }
            return;
        }

        // Escape и i всегда закрывают инвентарь
        if (key === 'Escape' || key === 'i') {
            this.isOpen = false;
            this.actionMenuOpen = false;
            this.showingDetails = false;
            return;
        }

        if (this.actionMenuOpen) {
            if (key === 'ArrowLeft') {
                this.actionMenuOpen = false;
            }
            return;
        }

        switch (key) {
            case 'ArrowUp':
                this.moveSelection(-1);
                break;
            case 'ArrowDown':
                this.moveSelection(1);
                break;
            case 'ArrowLeft':
                this.changePage(-1);
                break;
            case 'ArrowRight':
                this.changePage(1);
                break;
            case ' ': // Space
                this.toggleActionMenu();
                break;
        }
    }

    // Метод для переноса длинного текста с учётом доступного пространства
    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }
} 