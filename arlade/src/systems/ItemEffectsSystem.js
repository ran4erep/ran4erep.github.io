class ItemEffectsSystem {
    constructor(game) {
        this.game = game;
    }

    // Применяет эффекты предмета к игроку
    applyItemEffects(item) {
        if (!item || !item.effects) return;

        for (const effect of item.effects) {
            switch (effect.type) {
                case 'maxHealth':
                    this.game.maxHealth += effect.value;
                    break;
                case 'heal':
                    // Восстанавливаем здоровье, но не больше максимального
                    this.game.playerHealth = Math.min(this.game.playerHealth + effect.value, this.game.maxHealth);
                    break;
                case 'maxMana':
                    // TODO: Когда будет система маны
                    break;
                case 'strength':
                    this.game.playerStats.strength += effect.value;
                    break;
                case 'defense':
                    // TODO: Добавить базовую защиту игрока
                    break;
                case 'speed':
                    // TODO: Добавить скорость игрока
                    break;
                case 'regeneration':
                    // TODO: Добавить регенерацию
                    break;
                case 'manaRegeneration':
                    // TODO: Когда будет система маны
                    break;
                case 'criticalChance':
                    // TODO: Добавить шанс крита
                    break;
                case 'criticalDamage':
                    // TODO: Добавить множитель крит урона
                    break;
                case 'dodgeChance':
                    // TODO: Добавить шанс уворота
                    break;
                case 'blockChance':
                    // TODO: Добавить шанс блока
                    break;
                case 'blockValue':
                    // TODO: Добавить значение блока
                    break;
                case 'thorns':
                    // TODO: Добавить шипы
                    break;
                case 'lifeSteal':
                    // TODO: Добавить вампиризм
                    break;
                case 'manaSteal':
                    // TODO: Когда будет система маны
                    break;
                case 'experienceGain':
                    // TODO: Добавить множитель опыта
                    break;
                case 'goldGain':
                    // TODO: Добавить множитель золота
                    break;
                case 'lootChance':
                    // TODO: Добавить шанс лута
                    break;
                case 'custom':
                    // Для кастомных эффектов, которые не вписываются в стандартные
                    if (effect.apply) {
                        effect.apply(this.game);
                    }
                    break;
            }
        }
    }

    // Убирает эффекты предмета с игрока
    removeItemEffects(item) {
        if (!item || !item.effects) return;

        for (const effect of item.effects) {
            switch (effect.type) {
                case 'maxHealth':
                    this.game.maxHealth -= effect.value;
                    // Уменьшаем текущее здоровье если оно больше максимального
                    if (this.game.playerHealth > this.game.maxHealth) {
                        this.game.playerHealth = this.game.maxHealth;
                    }
                    break;
                case 'heal':
                    // Для эффекта лечения не нужно ничего убирать
                    break;
                case 'maxMana':
                    // TODO: Когда будет система маны
                    break;
                case 'strength':
                    this.game.playerStats.strength -= effect.value;
                    break;
                case 'defense':
                    // TODO: Добавить базовую защиту игрока
                    break;
                case 'speed':
                    // TODO: Добавить скорость игрока
                    break;
                case 'regeneration':
                    // TODO: Добавить регенерацию
                    break;
                case 'manaRegeneration':
                    // TODO: Когда будет система маны
                    break;
                case 'criticalChance':
                    // TODO: Добавить шанс крита
                    break;
                case 'criticalDamage':
                    // TODO: Добавить множитель крит урона
                    break;
                case 'dodgeChance':
                    // TODO: Добавить шанс уворота
                    break;
                case 'blockChance':
                    // TODO: Добавить шанс блока
                    break;
                case 'blockValue':
                    // TODO: Добавить значение блока
                    break;
                case 'thorns':
                    // TODO: Добавить шипы
                    break;
                case 'lifeSteal':
                    // TODO: Добавить вампиризм
                    break;
                case 'manaSteal':
                    // TODO: Когда будет система маны
                    break;
                case 'experienceGain':
                    // TODO: Добавить множитель опыта
                    break;
                case 'goldGain':
                    // TODO: Добавить множитель золота
                    break;
                case 'lootChance':
                    // TODO: Добавить шанс лута
                    break;
                case 'custom':
                    // Для кастомных эффектов, которые не вписываются в стандартные
                    if (effect.remove) {
                        effect.remove(this.game);
                    }
                    break;
            }
        }
    }
} 