class InventorySystem {
    constructor(game) {
        this.game = game;
        this.items = [];
        this.equipped = {
            leftHand: null,
            rightHand: null,
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
        this.showHandSelectionMenu = false;
        this.selectedHandIndex = 0;
        this.loadItems();
    }

    async loadItems() {
        const response = await fetch('src/data/items.json');
        const data = await response.json();
        this.itemsData = data.items;
        this.initStartingItems();
    }

    initStartingItems() {
        // Очищаем инвентарь и снаряжение
        this.items = [];
        this.equipped = {
            leftHand: null,
            rightHand: null,
            helmet: null,
            armor: null,
            legs: null
        };
        
        // Добавляем стартовые предметы
        this.addItem('rusty_sword');
        this.addItem('leather_helmet');
        this.addItem('leather_armor');
        this.addItem('leather_pants');
        this.addItem('battle_axe');
        this.addItem('dagger');
        this.addItem('pile_of_gold');
        
        // Экипируем стартовые предметы
        this.equipItemToHand(0, 'right'); // Меч в правую руку
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
        if (!item) return;

        if (item.type === 'weapon') {
            if (item.hands === 'both') {
                // Для двуручного оружия снимаем всё из обеих рук
                if (this.equipped.leftHand) {
                    this.equipped.leftHand.isEquipped = false;
                }
                if (this.equipped.rightHand) {
                    this.equipped.rightHand.isEquipped = false;
                }
                this.equipped.leftHand = item;
                this.equipped.rightHand = item;
                item.isEquipped = true;
            } else {
                // Для одноручного оружия показываем меню выбора руки
                this.showHandSelectionMenu = true;
                this.selectedHandIndex = 0;
                this.actionMenuOpen = false;
            }
            return;
        }

        // Для остальных предметов старая логика
        if (this.equipped[item.type]) {
            this.equipped[item.type].isEquipped = false;
        }
        item.isEquipped = true;
        this.equipped[item.type] = item;
    }

    equipItemToHand(index, hand) {
        const item = this.items[index];
        if (!item || item.type !== 'weapon') return;

        // Проверяем, можно ли экипировать оружие в выбранную руку
        if (item.hands === 'both') {
            // Двуручное оружие нельзя экипировать в одну руку
            return;
        }

        // Проверяем, нет ли в другой руке двуручного оружия
        const otherHand = hand === 'left' ? 'rightHand' : 'leftHand';
        if (this.equipped[otherHand] && this.equipped[otherHand].hands === 'both') {
            // Если в другой руке двуручное оружие, снимаем его
            this.equipped[otherHand].isEquipped = false;
            this.equipped.leftHand = null;
            this.equipped.rightHand = null;
        }

        // Если в этой руке уже что-то есть, снимаем
        if (this.equipped[hand + 'Hand']) {
            this.equipped[hand + 'Hand'].isEquipped = false;
        }

        item.isEquipped = true;
        this.equipped[hand + 'Hand'] = item;
    }

    unequipItem(index) {
        const item = this.items[index];
        if (!item || !item.isEquipped) return;

        if (item.type === 'weapon') {
            // Если это двуручное оружие, снимаем из обеих рук
            if (item.hands === 'both') {
                this.equipped.leftHand = null;
                this.equipped.rightHand = null;
            } else {
                // Для одноручного проверяем обе руки
                if (this.equipped.leftHand === item) {
                    this.equipped.leftHand = null;
                }
                if (this.equipped.rightHand === item) {
                    this.equipped.rightHand = null;
                }
            }
        } else {
            this.equipped[item.type] = null;
        }
        item.isEquipped = false;
    }

    dropItem(index) {
        if (index >= 0 && index < this.items.length) {
            const item = this.items[index];
            if (item.isEquipped) {
                this.unequipItem(index);
            }
            
            // Сохраняем текущую страницу и количество предметов на странице
            const itemsPerPage = this.getItemsPerPage();
            const currentPageBefore = this.currentPage;
            
            // Удаляем предмет
            this.items.splice(index, 1);
            
            // Проверяем, был ли это последний предмет на странице
            const totalPages = Math.ceil(this.items.length / itemsPerPage);
            
            // Если текущая страница больше не существует, переходим на предыдущую
            if (this.currentPage >= totalPages && totalPages > 0) {
                this.currentPage = totalPages - 1;
                this.selectedItemIndex = this.currentPage * itemsPerPage; // Устанавливаем курсор на первый элемент страницы
            } else if (this.selectedItemIndex >= this.items.length) {
                // Если текущий индекс больше количества предметов, 
                // устанавливаем его на последний предмет
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
        // Если открыто меню выбора руки, не обрабатываем перемещение
        if (this.showHandSelectionMenu) return;

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
        const startY = 260; // Уменьшаем начальную Y-координату списка, так как убрали надпись "Предметы:"
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
                this.showHandSelectionMenu = false;
            } else {
                // Выполняем выбранное действие
                const item = this.getSelectedItem();
                
                // Для предметов типа misc доступны только выброс и подробности
                const isMisc = item.type === 'misc';
                const actionIndex = isMisc ? this.selectedActionIndex : this.selectedActionIndex;
                
                if (isMisc) {
                    switch (actionIndex) {
                        case 0: // Выбросить
                            this.dropItem(this.selectedItemIndex);
                            this.actionMenuOpen = false;
                            break;
                        case 1: // Подробности
                            this.showingDetails = true;
                            this.actionMenuOpen = false;
                            break;
                    }
                } else {
                    switch (actionIndex) {
                        case 0: // Экипировать/Снять
                            if (item.isEquipped) {
                                this.unequipItem(this.selectedItemIndex);
                                this.actionMenuOpen = false;
                            } else if (item.type === 'weapon') {
                                if (item.hands === 'both') {
                                    // Двуручное оружие сразу экипируется в обе руки
                                    this.equipItem(this.selectedItemIndex);
                                    this.actionMenuOpen = false;
                                } else {
                                    // Для одноручного оружия показываем меню выбора руки
                                    this.showHandSelectionMenu = true;
                                    this.selectedHandIndex = 0;
                                    this.actionMenuOpen = false;
                                }
                            } else {
                                this.equipItem(this.selectedItemIndex);
                                this.actionMenuOpen = false;
                            }
                            break;
                        case 1: // Выбросить
                            this.dropItem(this.selectedItemIndex);
                            this.actionMenuOpen = false;
                            break;
                        case 2: // Подробности
                            this.showingDetails = true;
                            this.actionMenuOpen = false;
                            break;
                    }
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
        if (item.damage !== undefined) {
            const strMod = this.game.combatSystem.getStatModifier(this.game.playerStats.strength);
            const modText = strMod >= 0 ? `+${strMod}` : strMod;
            stats = `[${item.damage}] (${modText})`;
        } else if (item.defense !== undefined) {
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
            leftHand: 'Левая рука:',
            rightHand: 'Правая рука:',
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
                
                const totalWidth = padding + slotWidth + minSlotWidth + itemWidth + statsWidth + padding * 2;
                maxWidth = Math.max(maxWidth, totalWidth);
            }
        });
        
        // Проверяем предметы в инвентаре
        this.items.forEach(item => {
            const itemWidth = ctx.measureText(item.name + (item.isEquipped ? ' *' : '')).width;
            const stats = this.getItemStats(item);
            const statsWidth = stats ? ctx.measureText(stats).width : 0;
            
            const totalWidth = padding + 20 + itemWidth + statsWidth + padding * 2;
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
        const valueX = x + padding + 160;
        const statsX = x + width - padding * 2;

        ctx.font = '12px "Press Start 2P"';
        ctx.textAlign = 'left';

        Object.entries(this.equipped).forEach(([slot, item]) => {
            // Название слота
            ctx.fillStyle = '#666';
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

        // Список предметов (убираем надпись "Предметы:")
        const itemsStartY = dividerY + 30;
        const itemsPerPage = Math.floor((height - (itemsStartY - y) - 40) / 30);
        const startIndex = this.currentPage * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, this.items.length);

        // Отображаем предметы текущей страницы
        for (let i = startIndex; i < endIndex; i++) {
            const item = this.items[i];
            const itemY = itemsStartY + (i - startIndex) * 30;

            // Стрелка выбора
            if (i === this.selectedItemIndex && !this.showHandSelectionMenu) {
                ctx.fillStyle = '#fff';
                ctx.fillText('>', x + padding - 15, itemY);
            }

            // Название предмета
            ctx.fillStyle = '#fff';
            const itemName = (item.isEquipped ? '* ' : '') + item.name;
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
        if (this.actionMenuOpen && !this.showHandSelectionMenu && this.items.length > 0) {
            const item = this.getSelectedItem();
            const isMisc = item.type === 'misc';
            
            // Разные наборы действий для обычных предметов и предметов типа misc
            const actions = isMisc ? [
                'Выбросить',
                'Подробности'
            ] : [
                item.isEquipped ? 'Снять' : 'Экипировать',
                'Выбросить',
                'Подробности'
            ];

            // Вычисляем необходимую ширину меню
            let menuWidth = 160;
            actions.forEach(action => {
                const textWidth = ctx.measureText(action).width;
                menuWidth = Math.max(menuWidth, textWidth + 60); // 60px для стрелки и отступов
            });

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

        // Меню выбора руки
        if (this.showHandSelectionMenu && this.items.length > 0) {
            const hands = ['Правая рука', 'Левая рука'];

            // Вычисляем необходимую ширину меню
            let menuWidth = 160;
            hands.forEach(hand => {
                const handSlot = hand === 'Правая рука' ? 'rightHand' : 'leftHand';
                const isOccupied = this.equipped[handSlot] !== null;
                const text = hand + (isOccupied ? ' (занято)' : '');
                const textWidth = ctx.measureText(text).width;
                menuWidth = Math.max(menuWidth, textWidth + 40); // Уменьшаем отступ с 60px до 40px
            });

            const menuHeight = hands.length * 25 + 10; // Уменьшаем высоту строки с 30px до 25px
            const menuX = x + width - menuWidth - 20;
            const menuY = itemsStartY + (this.selectedItemIndex - startIndex) * 30 - 15;

            // Фон меню
            ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
            ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
            
            // Рамка меню
            ctx.strokeStyle = '#444';
            ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

            // Пункты меню
            hands.forEach((hand, index) => {
                const handSlot = index === 0 ? 'rightHand' : 'leftHand';
                const isOccupied = this.equipped[handSlot] !== null;
                
                // Если слот занят - серый цвет, если выбран - белый, иначе светло-серый
                if (isOccupied) {
                    ctx.fillStyle = '#444'; // Тёмно-серый для занятых слотов
                } else {
                    ctx.fillStyle = index === this.selectedHandIndex ? '#fff' : '#888';
                }
                
                ctx.textAlign = 'left';
                const handY = menuY + 18 + index * 25; // Уменьшаем отступ с 20px до 18px и высоту строки с 30px до 25px
                
                // Стрелка выбора
                if (index === this.selectedHandIndex) {
                    ctx.fillStyle = '#fff';
                    ctx.fillText('>', menuX + 8, handY); // Уменьшаем отступ с 10px до 8px
                    ctx.fillStyle = isOccupied ? '#444' : '#fff';
                }
                
                // Название руки
                ctx.fillText(hand + (isOccupied ? ' (занято)' : ''), menuX + 25, handY); // Уменьшаем отступ с 30px до 25px
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

        // Если открыто окно подробностей, обрабатываем только пробел и Escape
        if (this.showingDetails) {
            if (key === ' ' || key === 'Escape') {
                this.showingDetails = false;
                return;
            }
            return;
        }

        // Escape и i всегда закрывают инвентарь, но только если не открыто окно подробностей
        if (key === 'Escape' || key === 'i') {
            this.isOpen = false;
            this.actionMenuOpen = false;
            this.showingDetails = false;
            this.showHandSelectionMenu = false;
            return;
        }

        // Если открыто меню выбора руки
        if (this.showHandSelectionMenu) {
            switch (key) {
                case 'ArrowUp':
                    this.selectedHandIndex = 0; // Правая рука
                    return;
                case 'ArrowDown':
                    this.selectedHandIndex = 1; // Левая рука
                    return;
                case ' ':
                case 'Enter':
                    const hand = this.selectedHandIndex === 0 ? 'right' : 'left';
                    this.equipItemToHand(this.selectedItemIndex, hand);
                    this.showHandSelectionMenu = false;
                    return;
                case 'Escape':
                case 'ArrowLeft':
                    this.showHandSelectionMenu = false;
                    this.actionMenuOpen = true;
                    return;
            }
            return;
        }

        if (this.actionMenuOpen) {
            const item = this.getSelectedItem();
            const isMisc = item.type === 'misc';
            const maxActions = isMisc ? 2 : 3; // 2 действия для misc, 3 для остальных

            switch (key) {
                case 'ArrowUp':
                case 'ArrowDown':
                    this.selectedActionIndex = this.selectedActionIndex + (key === 'ArrowUp' ? -1 : 1);
                    if (this.selectedActionIndex < 0) {
                        this.selectedActionIndex = maxActions - 1;
                    } else if (this.selectedActionIndex >= maxActions) {
                        this.selectedActionIndex = 0;
                    }
                    return;
                case 'ArrowLeft':
                    this.actionMenuOpen = false;
                    return;
                case ' ':
                case 'Enter':
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
            case ' ':
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