class LootWindow {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.selectedIndex = 0;
        this.items = [];
        this.currentPage = 0;
        this.actionMenuOpen = false;
        this.selectedActionIndex = 0;
        this.showingDetails = false;
        this.windowHeight = 0; // Сохраняем высоту окна
        // Добавляем новые состояния для окна регулировки количества
        this.showQuantityWindow = false;
        this.pickupQuantity = 1;
    }

    open() {
        // Получаем все предметы на текущей позиции игрока
        const floorItems = this.game.floorItems
            .filter(item => 
                item.x === this.game.playerX && 
                item.y === this.game.playerY
            );

        // Группируем одинаковые предметы
        const groupedItems = new Map();
        floorItems.forEach(floorItem => {
            const item = floorItem.item;
            const key = item.id;
            if (!groupedItems.has(key)) {
                groupedItems.set(key, {
                    ...item,
                    quantity: 1,
                    floorItems: [floorItem]  // Переименовываем originalItems в floorItems
                });
            } else {
                const existingItem = groupedItems.get(key);
                existingItem.quantity++;
                existingItem.floorItems.push(floorItem);  // Используем floorItems вместо originalItems
            }
        });

        this.items = Array.from(groupedItems.values());

        if (this.items.length > 0) {
            this.isOpen = true;
            this.selectedIndex = 0;
            this.currentPage = 0;
            this.actionMenuOpen = false;
            this.showingDetails = false;

            // Рассчитываем высоту окна при открытии
            const headerHeight = 60;
            const footerHeight = 40;
            const itemHeight = 25;
            const itemsOnFirstPage = Math.min(this.items.length, 6);
            this.windowHeight = headerHeight + (itemsOnFirstPage * itemHeight) + footerHeight;
        }
    }

    close() {
        this.isOpen = false;
        this.selectedIndex = 0;
        this.items = [];
        this.currentPage = 0;
        this.actionMenuOpen = false;
        this.showingDetails = false;
    }

    getItemsPerPage() {
        // Фиксированное количество предметов на странице
        return 6;
    }

    moveSelection(direction) {
        if (this.actionMenuOpen) {
            // Перемещаем выбор в меню действий
            const item = this.items[this.selectedIndex];
            const actions = [
                'Поднять',
                item.quantity > 1 ? 'Поднять всё' : null,
                'Подробнее'
            ].filter(action => action !== null);
            
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

            this.selectedIndex += direction;

            // Если вышли за пределы текущей страницы вверх
            if (this.selectedIndex < startIndex) {
                if (this.currentPage > 0) {
                    // Переходим на предыдущую страницу
                    this.currentPage--;
                    this.selectedIndex = (this.currentPage + 1) * itemsPerPage - 1;
                } else {
                    // Переходим в конец списка
                    const lastPage = Math.floor((this.items.length - 1) / itemsPerPage);
                    this.currentPage = lastPage;
                    this.selectedIndex = this.items.length - 1;
                }
            }
            // Если вышли за пределы текущей страницы вниз
            else if (this.selectedIndex >= endIndex) {
                if (endIndex < this.items.length) {
                    // Переходим на следующую страницу
                    this.currentPage++;
                    this.selectedIndex = this.currentPage * itemsPerPage;
                } else {
                    // Переходим в начало списка
                    this.currentPage = 0;
                    this.selectedIndex = 0;
                }
            }
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
        this.selectedIndex = this.currentPage * itemsPerPage;
        
        // Если на последней странице вышли за пределы списка
        if (this.selectedIndex >= this.items.length) {
            this.selectedIndex = this.items.length - 1;
        }
    }

    toggleActionMenu() {
        if (!this.actionMenuOpen) {
            this.actionMenuOpen = true;
            this.selectedActionIndex = 0;
        } else {
            const item = this.items[this.selectedIndex];
            
            // Получаем список действий
            const actions = [
                'Поднять',
                item.quantity > 1 ? 'Поднять всё' : null,
                'Подробнее'
            ].filter(action => action !== null);

            // Получаем выбранное действие
            const selectedAction = actions[this.selectedActionIndex];

            switch (selectedAction) {
                case 'Поднять':
                    if (item.quantity > 1) {
                        this.showQuantityWindow = true;
                        this.pickupQuantity = 1;
                    } else {
                        this.pickupSelectedItem(false);
                    }
                    break;
                case 'Поднять всё':
                    this.pickupSelectedItem(true);
                    break;
                case 'Подробнее':
                    this.showingDetails = true;
                    // Устанавливаем максимальную высоту окна как в инвентаре
                    const headerHeight = 60;
                    const footerHeight = 40;
                    const itemHeight = 25;
                    this.windowHeight = headerHeight + (12 * itemHeight) + footerHeight; // Увеличиваем до 12 строк
                    break;
            }
            this.actionMenuOpen = false;
        }
    }

    handleKeyPress(key) {
        if (!this.isOpen) return;

        // Если открыто окно подробностей, обрабатываем только пробел и Escape
        if (this.showingDetails) {
            if (key === 'Space' || key === 'Escape') {
                this.showingDetails = false;
                // Возвращаем исходную высоту окна при закрытии подробностей
                const headerHeight = 60;
                const footerHeight = 40;
                const itemHeight = 25;
                const itemsOnFirstPage = Math.min(this.items.length, 6);
                this.windowHeight = headerHeight + (itemsOnFirstPage * itemHeight) + footerHeight;
                return;
            }
            return;
        }

        // Если открыто окно выбора количества
        if (this.showQuantityWindow) {
            const item = this.items[this.selectedIndex];
            switch (key) {
                case 'ArrowLeft':
                    this.pickupQuantity = Math.max(1, this.pickupQuantity - 1);
                    return;
                case 'ArrowRight':
                    this.pickupQuantity = Math.min(item.quantity, this.pickupQuantity + 1);
                    return;
                case 'Space':
                    this.pickupSelectedItem(false, this.pickupQuantity);
                    this.showQuantityWindow = false;
                    return;
                case 'Escape':
                    this.showQuantityWindow = false;
                    this.actionMenuOpen = true;
                    return;
            }
            return;
        }

        // Escape всегда закрывает окно, но только если не открыто окно подробностей
        if (key === 'Escape') {
            if (this.actionMenuOpen) {
                this.actionMenuOpen = false;
            } else {
                this.close();
            }
            return;
        }

        if (this.actionMenuOpen) {
            switch (key) {
                case 'ArrowUp':
                case 'ArrowDown':
                    this.moveSelection(key === 'ArrowUp' ? -1 : 1);
                    return;
                case 'ArrowLeft':
                    this.actionMenuOpen = false;
                    return;
                case 'Space':
                    this.toggleActionMenu();
                    return;
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
            case 'Space':
                this.toggleActionMenu();
                break;
        }
    }

    pickupSelectedItem(pickupAll = false, quantity = 1) {
        const item = this.items[this.selectedIndex];
        if (item) {
            // Определяем количество предметов для подбора
            const quantityToPickup = pickupAll ? item.quantity : quantity;
            
            // Добавляем предмет в инвентарь
            this.game.inventorySystem.addItem(item.id, quantityToPickup);
            
            // Если подбираем не все предметы, уменьшаем количество
            if (!pickupAll && item.quantity > quantityToPickup) {
                item.quantity -= quantityToPickup;
                
                // Удаляем нужное количество предметов с пола
                for (let i = 0; i < quantityToPickup; i++) {
                    const floorItem = item.floorItems[i];  // Используем floorItems
                    const floorItemIndex = this.game.floorItems.indexOf(floorItem);
                    if (floorItemIndex !== -1) {
                        this.game.floorItems.splice(floorItemIndex, 1);
                        item.floorItems.splice(i, 1);  // Удаляем из массива floorItems
                    }
                }
            } else {
                // Если подбираем все или остался последний предмет
                // Удаляем все предметы с пола
                item.floorItems.forEach(floorItem => {  // Используем floorItems
                    const floorItemIndex = this.game.floorItems.indexOf(floorItem);
                    if (floorItemIndex !== -1) {
                        this.game.floorItems.splice(floorItemIndex, 1);
                    }
                });
                
                // Удаляем предмет из списка
                this.items.splice(this.selectedIndex, 1);
                
                // Проверяем, был ли это последний предмет на странице
                const itemsPerPage = this.getItemsPerPage();
                const totalPages = Math.ceil(this.items.length / itemsPerPage);
                
                // Если текущая страница больше не существует, переходим на предыдущую
                if (this.currentPage >= totalPages && totalPages > 0) {
                    this.currentPage = totalPages - 1;
                    this.selectedIndex = this.currentPage * itemsPerPage;
                } else if (this.selectedIndex >= this.items.length) {
                    // Если текущий индекс больше количества предметов, 
                    // устанавливаем его на последний предмет
                    this.selectedIndex = Math.max(0, this.items.length - 1);
                }
                
                // Если предметов больше нет, закрываем меню
                if (this.items.length === 0) {
                    this.close();
                }
            }
        }
    }

    // Метод для получения строки характеристик предмета без модификаторов
    getItemStats(item) {
        let stats = '';
        if (item.damage !== undefined) {
            stats = `[${item.damage}]`;
        } else if (item.defense !== undefined) {
            stats = `[${item.defense}]`;
        }
        return stats;
    }

    render(ctx) {
        if (!this.isOpen || this.items.length === 0) {
            this.close();
            return;
        }

        // Настраиваем контекст для измерения текста
        ctx.font = '12px "Press Start 2P"';
        
        // Вычисляем необходимые размеры окна
        let maxNameWidth = 0;
        let maxStatsWidth = 0;
        const padding = 20;
        
        // Находим максимальную ширину имён предметов и их характеристик
        this.items.forEach(item => {
            const nameText = item.name + (item.quantity > 1 ? ` x${item.quantity}` : '');
            const nameWidth = ctx.measureText(nameText).width;
            maxNameWidth = Math.max(maxNameWidth, nameWidth);
            
            const stats = this.getItemStats(item);
            if (stats) {
                const statsWidth = ctx.measureText(stats).width;
                maxStatsWidth = Math.max(maxStatsWidth, statsWidth);
            }
        });
        
        // Вычисляем итоговую ширину окна
        const width = Math.max(600, maxNameWidth + maxStatsWidth + padding * 6);
        
        // Используем сохранённую высоту окна
        const height = this.windowHeight;
        
        // Позиционируем окно по центру экрана
        const x = (ctx.canvas.width - width) / 2;
        const y = (ctx.canvas.height - height) / 2;

        // Фон
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
        ctx.fillText('ПРЕДМЕТЫ НА ЗЕМЛЕ', x + width/2, y + 35);

        // Список предметов
        ctx.font = '12px "Press Start 2P"';
        ctx.textAlign = 'left';
        
        const itemsPerPage = this.getItemsPerPage();
        const startIndex = this.currentPage * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, this.items.length);
        
        const startY = y + 60 + 10;
        for (let i = startIndex; i < endIndex; i++) {
            const item = this.items[i];
            const itemY = startY + (i - startIndex) * 25;

            // Стрелка выбора
            if (i === this.selectedIndex) {
                ctx.fillStyle = '#fff';
                ctx.fillText('>', x + padding - 15, itemY);
            }

            // Название предмета
            ctx.fillStyle = '#fff';
            const nameText = item.name + (item.quantity > 1 ? ` x${item.quantity}` : '');
            ctx.fillText(nameText, x + padding, itemY);

            // Характеристики предмета
            const stats = this.getItemStats(item);
            if (stats) {
                ctx.fillStyle = '#888';
                ctx.textAlign = 'right';
                ctx.fillText(stats, x + width - padding * 2, itemY);
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
            const item = this.items[this.selectedIndex];
            const actions = [
                'Поднять',
                item.quantity > 1 ? 'Поднять всё' : null,
                'Подробнее'
            ].filter(action => action !== null);

            // Вычисляем необходимую ширину меню
            let menuWidth = 160;
            actions.forEach(action => {
                const textWidth = ctx.measureText(action).width;
                menuWidth = Math.max(menuWidth, textWidth + 60); // 60px для стрелки и отступов
            });

            const menuHeight = actions.length * 30 + 10;
            const menuX = x + width - menuWidth - 20;
            const menuY = startY + (this.selectedIndex - startIndex) * 30 - 15;

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
            const item = this.items[this.selectedIndex];
            
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
            const titleLines = this.game.inventorySystem.wrapText(ctx, item.name, contentWidth);
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
            const descriptionLines = this.game.inventorySystem.wrapText(ctx, item.description, contentWidth);
            
            // Проверяем, сколько строк поместится до кнопки
            const bottomButtonY = y + height - 60; // Увеличиваем отступ для кнопки
            const maxLines = Math.floor((bottomButtonY - currentY) / 30);
            
            descriptionLines.slice(0, maxLines).forEach(line => {
                ctx.fillText(line, x + width/2, currentY);
                currentY += 30;
            });

            // Рисуем кнопку "Закрыть"
            const buttonWidth = 100;
            const buttonHeight = 30;
            const buttonX = x + (width - buttonWidth) / 2;
            const buttonY = y + height - 60;

            // Фон кнопки
            ctx.fillStyle = '#444';
            ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
            
            // Рамка кнопки
            ctx.strokeStyle = '#666';
            ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
            
            // Текст кнопки
            ctx.font = '12px "Press Start 2P"';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText('Закрыть', x + width/2, buttonY + 20);
        }

        // Окно выбора количества
        if (this.showQuantityWindow && this.items.length > 0) {
            const item = this.items[this.selectedIndex];
            
            // Размеры окна
            const windowWidth = 300;
            const windowHeight = 150;
            const windowX = x + (width - windowWidth) / 2;
            const windowY = y + (height - windowHeight) / 2;
            
            // Фон окна
            ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
            ctx.fillRect(windowX, windowY, windowWidth, windowHeight);
            
            // Рамка окна
            ctx.strokeStyle = '#666';
            ctx.strokeRect(windowX, windowY, windowWidth, windowHeight);
            
            // Заголовок
            ctx.font = '16px "Press Start 2P"';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText('КОЛИЧЕСТВО', windowX + windowWidth/2, windowY + 40);
            
            // Слайдер
            const sliderWidth = 200;
            const sliderX = windowX + (windowWidth - sliderWidth) / 2;
            const sliderY = windowY + 80;
            
            // Фон слайдера
            ctx.fillStyle = '#444';
            ctx.fillRect(sliderX, sliderY, sliderWidth, 4);
            
            // Позиция ползунка
            const handlePosition = Math.floor((this.pickupQuantity - 1) * (sliderWidth - 20) / (item.quantity - 1));
            
            // Ползунок
            ctx.fillStyle = '#fff';
            ctx.fillRect(sliderX + handlePosition, sliderY - 8, 20, 20);
            
            // Текст количества
            ctx.font = '12px "Press Start 2P"';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.pickupQuantity} из ${item.quantity}`, windowX + windowWidth/2, windowY + 120);
        }
    }
} 