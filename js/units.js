// 游戏单位系统
class Unit {
    constructor(type, owner, q, r) {
        this.type = type;
        this.owner = owner;
        this.q = q;
        this.r = r;
        this.id = Math.random().toString(36).substr(2, 9);
        this.movementPoints = 0;
        this.maxMovementPoints = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.strength = 0;
        this.selected = false;
        this.actions = [];
        
        this.initializeUnitStats();
    }

    // 初始化单位属性
    initializeUnitStats() {
        const unitStats = {
            settler: {
                movementPoints: 2,
                health: 100,
                strength: 0,
                actions: ['found_city']
            },
            warrior: {
                movementPoints: 2,
                health: 100,
                strength: 8,
                actions: ['attack', 'fortify']
            },
            worker: {
                movementPoints: 2,
                health: 100,
                strength: 0,
                actions: ['build_improvement', 'build_road']
            },
            scout: {
                movementPoints: 3,
                health: 100,
                strength: 5,
                actions: ['explore']
            },
            archer: {
                movementPoints: 2,
                health: 100,
                strength: 6,
                actions: ['ranged_attack', 'fortify']
            }
        };

        const stats = unitStats[this.type];
        if (stats) {
            this.maxMovementPoints = stats.movementPoints;
            this.movementPoints = stats.movementPoints;
            this.maxHealth = stats.health;
            this.health = stats.health;
            this.strength = stats.strength;
            this.actions = [...stats.actions];
        }
    }

    // 移动单位
    moveTo(newQ, newR, map) {
        const targetTile = map.getTile(newQ, newR);
        if (!targetTile || !targetTile.canMoveTo()) {
            return false;
        }

        const distance = map.hexDistance(this.q, this.r, newQ, newR);
        const movementCost = targetTile.getMovementCost() * distance;

        if (this.movementPoints >= movementCost) {
            // 从当前地块移除单位
            const currentTile = map.getTile(this.q, this.r);
            if (currentTile) {
                currentTile.unit = null;
            }

            // 移动到新地块
            this.q = newQ;
            this.r = newR;
            this.movementPoints -= movementCost;
            targetTile.unit = this;

            // 探索周围区域
            this.exploreArea(map);
            
            return true;
        }
        
        return false;
    }

    // 探索周围区域
    exploreArea(map) {
        const currentTile = map.getTile(this.q, this.r);
        if (currentTile) {
            currentTile.explored = true;
            currentTile.visible = true;
        }

        // 探索相邻地块
        const neighbors = map.getNeighbors(this.q, this.r);
        neighbors.forEach(tile => {
            if (tile) {
                tile.explored = true;
                tile.visible = true;
            }
        });
    }

    // 建立城市（开拓者专用）
    foundCity(map, cityName = '新城市') {
        if (this.type !== 'settler') return false;

        const tile = map.getTile(this.q, this.r);
        if (!tile || !tile.canBuildCity()) return false;

        // 创建新城市
        const city = new City(cityName, this.owner, this.q, this.r);
        tile.city = city;
        tile.unit = null; // 开拓者消失

        // 从游戏中移除这个单位
        const game = window.game;
        if (game) {
            const unitIndex = game.units.indexOf(this);
            if (unitIndex > -1) {
                game.units.splice(unitIndex, 1);
            }
            game.cities.push(city);
        }

        return true;
    }

    // 攻击其他单位
    attack(target) {
        if (!target || target.owner === this.owner) return false;

        const damage = Math.max(1, this.strength - target.strength / 2);
        target.takeDamage(damage);

        // 攻击者也可能受到反击伤害
        if (target.health > 0) {
            const counterDamage = Math.max(1, target.strength / 2 - this.strength / 4);
            this.takeDamage(counterDamage);
        }

        this.movementPoints = 0; // 攻击后无法移动
        return true;
    }

    // 受到伤害
    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
        if (this.health <= 0) {
            this.destroy();
        }
    }

    // 销毁单位
    destroy() {
        const game = window.game;
        if (game) {
            const unitIndex = game.units.indexOf(this);
            if (unitIndex > -1) {
                game.units.splice(unitIndex, 1);
            }
        }

        // 从地块移除
        const map = window.game?.map;
        if (map) {
            const tile = map.getTile(this.q, this.r);
            if (tile && tile.unit === this) {
                tile.unit = null;
            }
        }
    }

    // 恢复移动点数（新回合）
    newTurn() {
        this.movementPoints = this.maxMovementPoints;
        
        // 自然恢复生命值
        if (this.health < this.maxHealth) {
            this.health = Math.min(this.maxHealth, this.health + 10);
        }
    }

    // 获取单位颜色
    getColor() {
        const colors = {
            0: '#e74c3c', // 玩家 - 红色
            1: '#3498db', // AI1 - 蓝色
            2: '#2ecc71', // AI2 - 绿色
            3: '#f39c12'  // AI3 - 橙色
        };
        return colors[this.owner] || '#95a5a6';
    }

    // 获取单位图标
    getIcon() {
        const icons = {
            settler: '🏘️',
            warrior: '⚔️',
            worker: '🔨',
            scout: '🔍',
            archer: '🏹'
        };
        return icons[this.type] || '👤';
    }

    // 渲染单位
    render(ctx, x, y) {
        const color = this.getColor();
        const icon = this.getIcon();

        // 绘制单位背景圆圈
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();

        // 绘制边框
        ctx.strokeStyle = this.selected ? '#f1c40f' : '#2c3e50';
        ctx.lineWidth = this.selected ? 3 : 2;
        ctx.stroke();

        // 绘制单位图标
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, x, y);

        // 绘制生命值条
        if (this.health < this.maxHealth) {
            const barWidth = 20;
            const barHeight = 3;
            const healthPercent = this.health / this.maxHealth;

            // 背景
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(x - barWidth/2, y + 18, barWidth, barHeight);

            // 生命值
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(x - barWidth/2, y + 18, barWidth * healthPercent, barHeight);
        }

        // 绘制移动点数指示器
        if (this.selected && this.movementPoints > 0) {
            for (let i = 0; i < this.movementPoints; i++) {
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.arc(x - 15 + i * 6, y - 18, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // 获取可移动的地块
    getValidMoves(map) {
        const validMoves = [];
        const visited = new Set();
        const queue = [{ q: this.q, r: this.r, cost: 0 }];

        while (queue.length > 0) {
            const current = queue.shift();
            const key = `${current.q},${current.r}`;
            
            if (visited.has(key)) continue;
            visited.add(key);

            if (current.cost <= this.movementPoints && (current.q !== this.q || current.r !== this.r)) {
                const tile = map.getTile(current.q, current.r);
                if (tile && tile.canMoveTo()) {
                    validMoves.push({ q: current.q, r: current.r });
                }
            }

            // 添加相邻地块到队列
            const neighbors = map.getNeighbors(current.q, current.r);
            neighbors.forEach(neighbor => {
                if (neighbor) {
                    const moveCost = neighbor.getMovementCost();
                    const totalCost = current.cost + moveCost;
                    
                    if (totalCost <= this.movementPoints) {
                        queue.push({ q: neighbor.q, r: neighbor.r, cost: totalCost });
                    }
                }
            });
        }

        return validMoves;
    }

    // 获取单位信息
    getInfo() {
        return {
            type: this.type,
            health: this.health,
            maxHealth: this.maxHealth,
            strength: this.strength,
            movementPoints: this.movementPoints,
            maxMovementPoints: this.maxMovementPoints,
            actions: this.actions
        };
    }
}

// 单位管理器
class UnitManager {
    constructor() {
        this.units = [];
        this.selectedUnit = null;
    }

    // 创建单位
    createUnit(type, owner, q, r) {
        const unit = new Unit(type, owner, q, r);
        this.units.push(unit);
        return unit;
    }

    // 选择单位
    selectUnit(unit) {
        // 取消之前选择的单位
        if (this.selectedUnit) {
            this.selectedUnit.selected = false;
        }

        this.selectedUnit = unit;
        if (unit) {
            unit.selected = true;
        }
    }

    // 获取指定位置的单位
    getUnitAt(q, r) {
        return this.units.find(unit => unit.q === q && unit.r === r);
    }

    // 获取玩家的所有单位
    getPlayerUnits(playerId) {
        return this.units.filter(unit => unit.owner === playerId);
    }

    // 新回合处理
    newTurn() {
        this.units.forEach(unit => unit.newTurn());
    }

    // 移除已销毁的单位
    cleanup() {
        this.units = this.units.filter(unit => unit.health > 0);
    }
}