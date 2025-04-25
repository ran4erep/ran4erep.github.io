class InventorySystem {
    constructor(game) {
        this.game = game;
        this.items = [];
        this.equipped = {
            leftHand: null,
            rightHand: null,
            helmet: null,
            armor: null,
            legs: null,
            accessory1: null,
            accessory2: null
        };
        this.selectedItemIndex = 0;
        this.selectedActionIndex = 0;
        this.isOpen = false;
        this.actionMenuOpen = false;
        this.showingDetails = false;
        this.currentPage = 0;
        this.showHandSelectionMenu = false;
        this.selectedHandIndex = 0;
        this.showAccessorySlotMenu = false;
        this.selectedAccessorySlotIndex = 0;
        this.showQuantityWindow = false;
        this.dropQuantity = 1;
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
            legs: null,
            accessory1: null,
            accessory2: null
        };
        
        // Добавляем стартовые предметы
        this.addItem('rusty_sword', 2);
        this.addItem('leather_helmet');
        this.addItem('leather_armor');
        this.addItem('leather_pants');
        this.addItem('battle_axe');
        this.addItem('dagger');
        this.addItem('gold_coin', 5);
        this.addItem('naked_pants');
        this.addItem('dick_ring');
        this.addItem('healing_potion', 3);
        
        // Экипируем стартовые предметы
        this.equipItemToHand(0, 'right'); // Меч в правую руку
        this.equipItem(1); // Шлем
        this.equipItem(2); // Броня
        this.equipItem(3); // Штаны
    }

    addItem(itemId, quantity = 1) {
        const itemData = this.itemsData[itemId];
        if (!itemData) return;

        // Ищем такой же предмет в инвентаре
        const existingItem = this.items.find(item => item.id === itemId);
        
        if (existingItem) {
            // Если такой предмет уже есть, увеличиваем его количество
            existingItem.quantity = (existingItem.quantity || 1) + quantity;
        } else {
            // Если предмета нет, добавляем новый
            this.items.push({
                id: itemId,
                quantity: quantity,
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
                    this.game.itemEffectsSystem.removeItemEffects(this.equipped.leftHand);
                    this.equipped.leftHand.isEquipped = false;
                }
                if (this.equipped.rightHand) {
                    this.game.itemEffectsSystem.removeItemEffects(this.equipped.rightHand);
                    this.equipped.rightHand.isEquipped = false;
                }
                this.equipped.leftHand = item;
                this.equipped.rightHand = item;
                item.isEquipped = true;
                this.game.itemEffectsSystem.applyItemEffects(item);
            } else {
                // Для одноручного оружия показываем меню выбора руки
                this.showHandSelectionMenu = true;
                this.selectedHandIndex = 0;
                this.actionMenuOpen = false;
            }
            return;
        }

        if (item.type === 'accessory') {
            // Показываем меню выбора слота аксессуара
            this.showAccessorySlotMenu = true;
            this.selectedAccessorySlotIndex = 0;
            this.actionMenuOpen = false;
            return;
        }

        // Для остальных предметов старая логика
        if (this.equipped[item.type]) {
            this.game.itemEffectsSystem.removeItemEffects(this.equipped[item.type]);
            this.equipped[item.type].isEquipped = false;
        }
        item.isEquipped = true;
        this.equipped[item.type] = item;
        this.game.itemEffectsSystem.applyItemEffects(item);
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
            this.game.itemEffectsSystem.removeItemEffects(this.equipped[otherHand]);
            this.equipped[otherHand].isEquipped = false;
            this.equipped.leftHand = null;
            this.equipped.rightHand = null;
        }

        // Если в этой руке уже что-то есть, снимаем
        if (this.equipped[hand + 'Hand']) {
            this.game.itemEffectsSystem.removeItemEffects(this.equipped[hand + 'Hand']);
            this.equipped[hand + 'Hand'].isEquipped = false;
        }

        item.isEquipped = true;
        this.equipped[hand + 'Hand'] = item;
        this.game.itemEffectsSystem.applyItemEffects(item);
    }

    unequipItem(index) {
        const item = this.items[index];
        if (!item || !item.isEquipped) return;

        if (item.type === 'weapon') {
            // Если это двуручное оружие, снимаем из обеих рук
            if (item.hands === 'both') {
                this.equipped.leftHand = null;
                this.equipped.rightHand = null;
                this.game.itemEffectsSystem.removeItemEffects(item);
            } else {
                // Для одноручного проверяем обе руки
                if (this.equipped.leftHand === item) {
                    this.equipped.leftHand = null;
                    this.game.itemEffectsSystem.removeItemEffects(item);
                }
                if (this.equipped.rightHand === item) {
                    this.equipped.rightHand = null;
                    this.game.itemEffectsSystem.removeItemEffects(item);
                }
            }
        } else if (item.type === 'accessory') {
            // Для аксессуаров проверяем оба слота
            if (this.equipped.accessory1 === item) {
                this.equipped.accessory1 = null;
                this.game.itemEffectsSystem.removeItemEffects(item);
            }
            if (this.equipped.accessory2 === item) {
                this.equipped.accessory2 = null;
                this.game.itemEffectsSystem.removeItemEffects(item);
            }
        } else {
            this.equipped[item.type] = null;
            this.game.itemEffectsSystem.removeItemEffects(item);
        }
        item.isEquipped = false;
    }

    dropItem(index, dropAll = false, quantity = 1) {
        if (index < 0 || index >= this.items.length) return;
        
        const item = this.items[index];
        
        // Считаем, сколько экземпляров этого предмета экипировано
        let equippedCount = 0;
        if (item.isEquipped) {
            if (item.type === 'weapon') {
                if (this.equipped.leftHand === item) equippedCount++;
                if (this.equipped.rightHand === item) equippedCount++;
            } else {
                equippedCount = 1;
            }
        }
        
        // Определяем количество предметов для выбрасывания
        const quantityToDrop = dropAll ? item.quantity : quantity;
        
        // Если предмет экипирован и количество предметов уменьшится до меньшего, чем экипировано
        // Нужно снять лишние экземпляры
        if (item.isEquipped && (item.quantity - quantityToDrop < equippedCount)) {
            // Если выбрасываем все или остаётся меньше чем экипировано, снимаем предмет
            if (dropAll || item.quantity - quantityToDrop < equippedCount) {
                if (item.type === 'weapon') {
                    this.equipped.leftHand = null;
                    this.equipped.rightHand = null;
                } else if (item.type) {
                    this.equipped[item.type] = null;
                }
                item.isEquipped = false;
            }
        }
        
        // Запоминаем, удаляем ли мы предмет полностью
        const isRemovingItem = dropAll || item.quantity <= quantityToDrop;
        
        // Выбрасываем предметы на пол
        for (let i = 0; i < quantityToDrop; i++) {
            this.game.floorItems.push({
                x: this.game.playerX,
                y: this.game.playerY,
                item: {...item, quantity: 1, isEquipped: false}
            });
        }
        
        // Обновляем количество или удаляем предмет
        if (isRemovingItem) {
            this.items.splice(index, 1);
        } else {
            item.quantity -= quantityToDrop;
        }
        
        // Корректируем выбранный индекс, если мы полностью удалили предмет
        if (isRemovingItem) {
            // Если удалили последний предмет в списке, перемещаем курсор на предыдущий
            if (this.selectedItemIndex >= this.items.length) {
                this.selectedItemIndex = Math.max(0, this.items.length - 1);
            }
        }
        
        // Проверяем наличие страниц
        const itemsPerPage = this.getItemsPerPage();
        const totalPages = Math.ceil(this.items.length / itemsPerPage);
        
        // Если текущая страница больше не существует, переходим на предыдущую
        if (this.currentPage >= totalPages && totalPages > 0) {
            this.currentPage = totalPages - 1;
            this.selectedItemIndex = Math.min(
                this.currentPage * itemsPerPage + itemsPerPage - 1, 
                this.items.length - 1
            );
        }
    }

    toggleInventory() {
        this.isOpen = !this.isOpen;
        this.actionMenuOpen = false;
        this.showingDetails = false;
        this.showHandSelectionMenu = false;
        this.selectedHandIndex = 0;
        this.selectedItemIndex = 0;
        this.currentPage = 0;
    }

    moveSelection(direction) {
        // Если открыто меню выбора руки, не обрабатываем перемещение
        if (this.showHandSelectionMenu) return;

        if (this.actionMenuOpen) {
            // Перемещаем выбор в меню действий
            const item = this.getSelectedItem();
            const isMisc = item.type === 'misc';
            
            // Получаем список действий
            const actions = isMisc ? [
                'Выбросить',
                item.quantity > 1 ? 'Выбросить всё' : null,
                'Подробнее'
            ].filter(action => action !== null) : [
                // Для предметов типа usable показываем "Использовать" вместо "Экипировать"
                item.type === 'usable' ? 'Использовать' : (item.isEquipped ? 'Снять' : 'Экипировать'),
                // Добавляем опцию "Экипировать" для оружия со стаком, если оно уже экипировано
                // но только для одноручного оружия и только если оно не экипировано в обе руки
                (item.type === 'weapon' && 
                 item.quantity > 1 && 
                 item.isEquipped && 
                 item.hands !== 'both' && 
                 !(this.equipped.leftHand === item && this.equipped.rightHand === item)) ? 
                    'Экипировать' : null,
                'Выбросить',
                item.quantity > 1 ? 'Выбросить всё' : null,
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
        // Возвращаем фиксированное количество предметов на странице
        return 6;
    }

    toggleActionMenu() {
        if (this.items.length > 0) {
            if (!this.actionMenuOpen) {
                this.actionMenuOpen = true;
                this.selectedActionIndex = 0;
                this.showingDetails = false;
                this.showHandSelectionMenu = false;
                this.showAccessorySlotMenu = false;
                this.showQuantityWindow = false;
            } else {
                // Выполняем выбранное действие
                const item = this.getSelectedItem();
                
                // Для предметов типа misc доступны только выброс и подробности
                const isMisc = item.type === 'misc';
                
                if (isMisc) {
                    // Получаем список действий
                    const actions = [
                        'Выбросить',
                        item.quantity > 1 ? 'Выбросить всё' : null,
                        'Подробнее'
                    ].filter(action => action !== null);

                    // Получаем выбранное действие
                    const selectedAction = actions[this.selectedActionIndex];

                    switch (selectedAction) {
                        case 'Выбросить':
                            if (item.quantity > 1) {
                                this.showQuantityWindow = true;
                                this.dropQuantity = 1;
                                this.actionMenuOpen = false;
                            } else {
                                this.dropItem(this.selectedItemIndex);
                                this.actionMenuOpen = false;
                            }
                            break;
                        case 'Выбросить всё':
                            this.dropItem(this.selectedItemIndex, true);
                            this.actionMenuOpen = false;
                            break;
                        case 'Подробнее':
                            this.showingDetails = true;
                            this.actionMenuOpen = false;
                            break;
                    }
                } else {
                    // Получаем список действий
                    const actions = [
                        // Для предметов типа usable показываем "Использовать" вместо "Экипировать"
                        item.type === 'usable' ? 'Использовать' : (item.isEquipped ? 'Снять' : 'Экипировать'),
                        // Добавляем опцию "Экипировать" для оружия со стаком, если оно уже экипировано
                        // но только для одноручного оружия и только если оно не экипировано в обе руки
                        (item.type === 'weapon' && 
                         item.quantity > 1 && 
                         item.isEquipped && 
                         item.hands !== 'both' && 
                         !(this.equipped.leftHand === item && this.equipped.rightHand === item)) ? 
                            'Экипировать' : null,
                        'Выбросить',
                        item.quantity > 1 ? 'Выбросить всё' : null,
                        'Подробнее'
                    ].filter(action => action !== null);

                    // Получаем выбранное действие
                    const selectedAction = actions[this.selectedActionIndex];

                    switch (selectedAction) {
                        case 'Использовать':
                            // Применяем эффекты предмета
                            this.game.itemEffectsSystem.applyItemEffects(item);
                            // Уменьшаем количество предметов
                            if (item.quantity > 1) {
                                item.quantity--;
                            } else {
                                // Если это был последний предмет, удаляем его из инвентаря
                                this.items.splice(this.selectedItemIndex, 1);
                                // Корректируем индекс выбранного предмета
                                if (this.selectedItemIndex >= this.items.length) {
                                    this.selectedItemIndex = Math.max(0, this.items.length - 1);
                                }
                            }
                            this.actionMenuOpen = false;
                            
                            // Проверяем видимость врагов
                            const visibleArea = this.game.camera.getVisibleArea();
                            const visibleEnemies = this.game.enemySystem.enemies.filter(enemy => {
                                // Проверяем, находится ли враг в видимой области камеры
                                if (enemy.x < visibleArea.startTileX || enemy.x >= visibleArea.endTileX ||
                                    enemy.y < visibleArea.startTileY || enemy.y >= visibleArea.endTileY) {
                                    return false;
                                }

                                // Проверяем видимость врага (не в чёрном тумане войны)
                                const visibility = visionSystem.visibilityMap[enemy.y][enemy.x];
                                return visibility === 2;
                            });

                            // Закрываем инвентарь только если есть видимые враги
                            if (visibleEnemies.length > 0) {
                                this.isOpen = false;
                            }
                            
                            // Запускаем ход противников
                            this.game.startEnemyTurn();
                            break;
                        case 'Снять':
                            if (item.type === 'weapon') {
                                const leftEquipped = this.equipped.leftHand && this.equipped.leftHand.id === item.id;
                                const rightEquipped = this.equipped.rightHand && this.equipped.rightHand.id === item.id;
                                
                                // Если это двуручное оружие или предмет экипирован только в одну руку, снимаем без меню
                                if (item.hands === 'both' || !(leftEquipped && rightEquipped)) {
                                    this.unequipItem(this.selectedItemIndex);
                                    this.actionMenuOpen = false;
                                } else {
                                    // Только для одноручного оружия в обеих руках показываем меню выбора
                                    this.showHandSelectionMenu = true;
                                    this.selectedHandIndex = 0;
                                    this.actionMenuOpen = false;
                                }
                            } else {
                                this.unequipItem(this.selectedItemIndex);
                                this.actionMenuOpen = false;
                            }
                            break;
                        case 'Экипировать':
                            if (item.type === 'weapon') {
                                if (item.hands === 'both') {
                                    this.equipItem(this.selectedItemIndex);
                                    this.actionMenuOpen = false;
                                } else {
                                    this.showHandSelectionMenu = true;
                                    this.selectedHandIndex = 0;
                                    this.actionMenuOpen = false;
                                }
                            } else {
                                this.equipItem(this.selectedItemIndex);
                                this.actionMenuOpen = false;
                            }
                            break;
                        case 'Выбросить':
                            if (item.quantity > 1) {
                                this.showQuantityWindow = true;
                                this.dropQuantity = 1;
                                this.actionMenuOpen = false;
                            } else {
                                this.dropItem(this.selectedItemIndex);
                                this.actionMenuOpen = false;
                            }
                            break;
                        case 'Выбросить всё':
                            this.dropItem(this.selectedItemIndex, true);
                            this.actionMenuOpen = false;
                            break;
                        case 'Подробнее':
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
        if (this.isOpen) {
            this.renderInventory(ctx);
        }
    }

    renderInventory(ctx) {
        // Базовые размеры окна
        let width = 500;
        const height = 530;
        
        // Настраиваем контекст для измерения текста
        ctx.font = '12px "Press Start 2P"';
        
        // Проверяем размеры для экипированных предметов
        const slotNames = {
            leftHand: 'Левая рука:',
            rightHand: 'Правая рука:',
            helmet: 'Шлем:',
            armor: 'Броня:',
            legs: 'Штаны:',
            accessory1: 'Аксессуар 1:',
            accessory2: 'Аксессуар 2:'
        };

        // Минимальная ширина для слотов
        const minSlotWidth = 150;  // Увеличиваем для названия слота
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
            const itemName = item.name + (item.isEquipped ? ' *' : '');
            const quantityText = item.quantity > 1 ? ` x${item.quantity}` : '';
            const itemWidth = ctx.measureText(itemName + quantityText).width;
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
        ctx.font = '12px "Press Start 2P"';
        ctx.textAlign = 'left';

        Object.entries(this.equipped).forEach(([slot, item], index) => {
            const equipY = y + 80 + index * 30;  // Увеличиваем начальную Y-координату
            
            // Название слота
            ctx.fillStyle = '#666';
            ctx.fillText(slotNames[slot], x + padding, equipY);
            
            // Значение (название предмета)
            ctx.fillStyle = item ? '#fff' : '#666';
            const valueX = x + padding + minSlotWidth;
            const itemName = item ? item.name : '(пусто)';
            ctx.fillText(itemName, valueX, equipY);
            
            // Характеристики
            if (item) {
                const stats = this.getItemStats(item);
                if (stats) {
                    ctx.fillStyle = '#666';
                    ctx.textAlign = 'right';
                    ctx.fillText(stats, x + width - padding, equipY);
                    ctx.textAlign = 'left';
                }
            }
        });

        // Разделитель
        const dividerY = y + 300;  // Увеличиваем Y-координату разделителя с 250 до 300
        ctx.strokeStyle = '#444';
        ctx.beginPath();
        ctx.moveTo(x + padding, dividerY);
        ctx.lineTo(x + width - padding, dividerY);
        ctx.stroke();

        // Список предметов
        const itemsStartY = dividerY + 30;
        const itemsPerPage = 6; // Фиксированное количество предметов на странице
        const startIndex = this.currentPage * itemsPerPage;
        const endIndex = Math.min(startIndex + 6, this.items.length); // Фиксированное количество предметов на странице

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
            const quantityText = item.quantity > 1 ? ` x${item.quantity}` : '';
            ctx.fillText(itemName + quantityText, x + padding, itemY);
            
            // Характеристики предмета
            const stats = this.getItemStats(item);
            if (stats) {
                ctx.fillStyle = '#888';
                ctx.textAlign = 'right';
                ctx.fillText(stats, x + width - padding, itemY);
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
            
            // Получаем список действий
            const actions = isMisc ? [
                'Выбросить',
                item.quantity > 1 ? 'Выбросить всё' : null,
                'Подробнее'
            ].filter(action => action !== null) : [
                // Для предметов типа usable показываем "Использовать" вместо "Экипировать"
                item.type === 'usable' ? 'Использовать' : (item.isEquipped ? 'Снять' : 'Экипировать'),
                // Добавляем опцию "Экипировать" для оружия со стаком, если оно уже экипировано
                // но только для одноручного оружия и только если оно не экипировано в обе руки
                (item.type === 'weapon' && 
                 item.quantity > 1 && 
                 item.isEquipped && 
                 item.hands !== 'both' && 
                 !(this.equipped.leftHand === item && this.equipped.rightHand === item)) ? 
                    'Экипировать' : null,
                'Выбросить',
                item.quantity > 1 ? 'Выбросить всё' : null,
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

        // Меню выбора слота аксессуара
        if (this.showAccessorySlotMenu && this.items.length > 0) {
            const slots = ['Слот 1', 'Слот 2'];

            // Вычисляем необходимую ширину меню
            let menuWidth = 160;
            slots.forEach(slot => {
                const slotName = slot === 'Слот 1' ? 'accessory1' : 'accessory2';
                const isOccupied = this.equipped[slotName] !== null;
                const text = slot + (isOccupied ? ' (занято)' : '');
                const textWidth = ctx.measureText(text).width;
                menuWidth = Math.max(menuWidth, textWidth + 40);
            });

            const menuHeight = slots.length * 25 + 10;
            const menuX = x + width - menuWidth - 20;
            const menuY = itemsStartY + (this.selectedItemIndex - startIndex) * 30 - 15;

            // Фон меню
            ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
            ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
            
            // Рамка меню
            ctx.strokeStyle = '#444';
            ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

            // Пункты меню
            slots.forEach((slot, index) => {
                const slotName = index === 0 ? 'accessory1' : 'accessory2';
                const isOccupied = this.equipped[slotName] !== null;
                
                // Если слот занят - серый цвет, если выбран - белый, иначе светло-серый
                if (isOccupied) {
                    ctx.fillStyle = '#444';
                } else {
                    ctx.fillStyle = index === this.selectedAccessorySlotIndex ? '#fff' : '#888';
                }
                
                ctx.textAlign = 'left';
                const slotY = menuY + 18 + index * 25;
                
                // Стрелка выбора
                if (index === this.selectedAccessorySlotIndex) {
                    ctx.fillStyle = '#fff';
                    ctx.fillText('>', menuX + 8, slotY);
                    ctx.fillStyle = isOccupied ? '#444' : '#fff';
                }
                
                // Название слота
                ctx.fillText(slot + (isOccupied ? ' (занято)' : ''), menuX + 25, slotY);
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

        // Окно выбора количества
        if (this.showQuantityWindow && this.items.length > 0) {
            const item = this.getSelectedItem();
            
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
            const handlePosition = Math.floor((this.dropQuantity - 1) * (sliderWidth - 20) / (item.quantity - 1));
            
            // Ползунок
            ctx.fillStyle = '#fff';
            ctx.fillRect(sliderX + handlePosition, sliderY - 8, 20, 20);
            
            // Текст количества
            ctx.font = '12px "Press Start 2P"';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.dropQuantity} из ${item.quantity}`, windowX + windowWidth/2, windowY + 120);
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

        // Если открыто окно выбора количества
        if (this.showQuantityWindow) {
            const item = this.getSelectedItem();
            switch (key) {
                case 'ArrowLeft':
                    this.dropQuantity = Math.max(1, this.dropQuantity - 1);
                    return;
                case 'ArrowRight':
                    this.dropQuantity = Math.min(item.quantity, this.dropQuantity + 1);
                    return;
                case ' ':
                case 'Enter':
                    this.dropItem(this.selectedItemIndex, false, this.dropQuantity);
                    this.showQuantityWindow = false;
                    return;
                case 'Escape':
                    this.showQuantityWindow = false;
                    this.actionMenuOpen = true;
                    return;
            }
            return;
        }

        // i всегда закрывает инвентарь
        if (key === 'i') {
            this.isOpen = false;
            this.actionMenuOpen = false;
            this.showingDetails = false;
            this.showHandSelectionMenu = false;
            this.showAccessorySlotMenu = false;
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
                    const item = this.getSelectedItem();
                    const handSlot = hand + 'Hand';
                    
                    // Двуручное оружие не должно попадать в это меню, но на всякий случай проверим
                    if (item.hands === 'both') {
                        // Для двуручного оружия просто снимаем его с обеих рук
                        if (item.isEquipped) {
                            this.unequipItem(this.selectedItemIndex);
                        } else {
                            this.equipItem(this.selectedItemIndex);
                        }
                        this.showHandSelectionMenu = false;
                        return;
                    }
                    
                    // Определяем, экипировать или снимать предмет
                    if (item.isEquipped) {
                        // Проверяем, не является ли текущий выбор попыткой экипировать уже экипированное
                        // но в другую руку предмет (для предметов со стаком)
                        const leftEquipped = this.equipped.leftHand === item;
                        const rightEquipped = this.equipped.rightHand === item;
                        const equipInOtherHand = item.quantity > 1 && 
                                                 ((hand === 'left' && rightEquipped && !leftEquipped) || 
                                                  (hand === 'right' && leftEquipped && !rightEquipped));
                        
                        if (equipInOtherHand) {
                            // Экипируем предмет в выбранную руку
                            this.equipped[handSlot] = item;
                        } else {
                            // Снимаем предмет с выбранной руки
                            if (this.equipped[handSlot] === item) {
                                this.equipped[handSlot] = null;
                                
                                // Если предмет больше не экипирован ни в одной руке, отмечаем его как неэкипированный
                                if (this.equipped.leftHand !== item && this.equipped.rightHand !== item) {
                                    item.isEquipped = false;
                                }
                            }
                        }
                    } else {
                        // Экипируем предмет в выбранную руку
                        this.equipItemToHand(this.selectedItemIndex, hand);
                    }
                    
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

        // Если открыто меню выбора слота аксессуара
        if (this.showAccessorySlotMenu) {
            switch (key) {
                case 'ArrowUp':
                    this.selectedAccessorySlotIndex = 0; // Слот 1
                    return;
                case 'ArrowDown':
                    this.selectedAccessorySlotIndex = 1; // Слот 2
                    return;
                case ' ':
                case 'Enter':
                    const slot = this.selectedAccessorySlotIndex === 0 ? 'accessory1' : 'accessory2';
                    const item = this.getSelectedItem();
                    
                    // Если в слоте уже есть предмет, снимаем его
                    if (this.equipped[slot]) {
                        this.game.itemEffectsSystem.removeItemEffects(this.equipped[slot]);
                        this.equipped[slot].isEquipped = false;
                    }
                    
                    // Экипируем предмет в выбранный слот
                    this.equipped[slot] = item;
                    item.isEquipped = true;
                    this.game.itemEffectsSystem.applyItemEffects(item);
                    
                    this.showAccessorySlotMenu = false;
                    return;
                case 'Escape':
                case 'ArrowLeft':
                    this.showAccessorySlotMenu = false;
                    this.actionMenuOpen = true;
                    return;
            }
            return;
        }

        if (this.actionMenuOpen) {
            const item = this.getSelectedItem();
            const isMisc = item.type === 'misc';
            
            // Получаем список действий
            const actions = isMisc ? [
                'Выбросить',
                item.quantity > 1 ? 'Выбросить всё' : null,
                'Подробнее'
            ].filter(action => action !== null) : [
                item.isEquipped ? 'Снять' : 'Экипировать',
                // Добавляем опцию "Экипировать" для оружия со стаком, если оно уже экипировано
                // но только для одноручного оружия и только если оно не экипировано в обе руки
                (item.type === 'weapon' && 
                 item.quantity > 1 && 
                 item.isEquipped && 
                 item.hands !== 'both' && 
                 !(this.equipped.leftHand === item && this.equipped.rightHand === item)) ? 
                    'Экипировать' : null,
                'Выбросить',
                item.quantity > 1 ? 'Выбросить всё' : null,
                'Подробнее'
            ].filter(action => action !== null);

            switch (key) {
                case 'ArrowUp':
                case 'ArrowDown':
                    this.selectedActionIndex = this.selectedActionIndex + (key === 'ArrowUp' ? -1 : 1);
                    if (this.selectedActionIndex < 0) {
                        this.selectedActionIndex = actions.length - 1;
                    } else if (this.selectedActionIndex >= actions.length) {
                        this.selectedActionIndex = 0;
                    }
                    return;
                case 'ArrowLeft':
                case 'Escape':
                    this.actionMenuOpen = false;
                    return;
                case ' ':
                case 'Enter':
                    this.toggleActionMenu();
                    return;
            }
            return;
        }

        // Если нажат Escape и нет открытых меню - закрываем инвентарь
        if (key === 'Escape') {
            this.isOpen = false;
            this.actionMenuOpen = false;
            this.showingDetails = false;
            this.showHandSelectionMenu = false;
            this.showAccessorySlotMenu = false;
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

    openInventory(x, y) {
        // Проверяем, что инвентарь не открыт
        if (this.isOpen) {
            return;
        }
        
        this.isOpen = true;
        this.actionMenuOpen = false;
        this.showingDetails = false;
        this.showHandSelectionMenu = false;
        this.selectedHandIndex = 0;
        this.selectedItemIndex = 0;
        this.currentPage = 0;
        
        // Сохраняем позицию для отображения
        this.inventoryX = x;
        this.inventoryY = y;
    }
} 