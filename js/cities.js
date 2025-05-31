// 城市系统
class City {
    constructor(name, owner, q, r) {
        this.name = name;
        this.owner = owner;
        this.q = q;
        this.r = r;
        this.id = Math.random().toString(36).substr(2, 9);
        this.population = 1;
        this.size = 1;
        this.food = 0;
        this.production = 0;
        this.culture = 0;
        this.science = 0;
        this.gold = 0;
        this.buildings = [];
        this.workingTiles = [];
        this.productionQueue = [];
        this.currentProduction = null;
        this.productionProgress = 0;
        this.founded = true;
        
        this.initializeCity();
    }

    // 初始化城市
    initializeCity() {
        // 城市自动工作中心地块
        this.workingTiles.push({ q: this.q, r: this.r });
        
        // 添加基础建筑
        this.buildings.push({
            type: 'palace',
            name: '宫殿',
            effects: { culture: 1, science: 1 }
        });
    }

    // 计算城市产出
    calculateYields(map) {
        let totalYields = {
            food: 0,
            production: 0,
            gold: 0,
            science: 0,
            culture: 0
        };

        // 计算工作地块的产出
        this.workingTiles.forEach(tilePos => {
            const tile = map.getTile(tilePos.q, tilePos.r);
            if (tile) {
                totalYields.food += tile.yields.food;
                totalYields.production += tile.yields.production;
                totalYields.gold += tile.yields.gold;
            }
        });

        // 建筑加成
        this.buildings.forEach(building => {
            if (building.effects) {
                Object.keys(building.effects).forEach(key => {
                    if (totalYields.hasOwnProperty(key)) {
                        totalYields[key] += building.effects[key];
                    }
                });
            }
        });

        // 人口加成
        totalYields.science += Math.floor(this.population / 2);
        totalYields.culture += Math.floor(this.population / 3);

        return totalYields;
    }

    // 处理回合
    processTurn(map) {
        const yields = this.calculateYields(map);
        
        // 累积资源
        this.food += yields.food;
        this.production += yields.production;
        this.gold += yields.gold;
        this.science += yields.science;
        this.culture += yields.culture;

        // 处理人口增长
        this.processPopulationGrowth();

        // 处理生产
        this.processProduction();

        // 自动分配工作地块
        this.autoAssignTiles(map);

        return yields;
    }

    // 处理人口增长
    processPopulationGrowth() {
        const foodNeeded = this.population * 2 + 10; // 人口增长所需食物
        
        if (this.food >= foodNeeded) {
            this.food -= foodNeeded;
            this.population++;
            this.size = Math.floor(this.population / 2) + 1;
            
            // 添加游戏消息
            if (window.game) {
                window.game.addMessage(`${this.name} 人口增长到 ${this.population}！`);
            }
        }
    }

    // 处理生产
    processProduction() {
        if (this.currentProduction) {
            this.productionProgress += this.production;
            
            const productionCost = this.getProductionCost(this.currentProduction);
            
            if (this.productionProgress >= productionCost) {
                this.completeProduction();
            }
        }
    }

    // 完成生产
    completeProduction() {
        const item = this.currentProduction;
        
        if (item.type === 'unit') {
            this.produceUnit(item.unitType);
        } else if (item.type === 'building') {
            this.produceBuilding(item.buildingType);
        }

        // 重置生产
        this.productionProgress = 0;
        this.currentProduction = null;

        // 处理生产队列
        if (this.productionQueue.length > 0) {
            this.currentProduction = this.productionQueue.shift();
        }
    }

    // 生产单位
    produceUnit(unitType) {
        const game = window.game;
        if (!game) return;

        // 寻找空闲地块放置单位
        const spawnTile = this.findSpawnLocation(game.map);
        if (spawnTile) {
            const unit = new Unit(unitType, this.owner, spawnTile.q, spawnTile.r);
            spawnTile.unit = unit;
            game.units.push(unit);
            
            game.addMessage(`${this.name} 完成了 ${this.getUnitName(unitType)} 的训练！`);
        } else {
            game.addMessage(`${this.name} 无法放置新单位，周围没有空闲地块！`);
        }
    }

    // 生产建筑
    produceBuilding(buildingType) {
        const building = this.createBuilding(buildingType);
        this.buildings.push(building);
        
        if (window.game) {
            window.game.addMessage(`${this.name} 完成了 ${building.name} 的建造！`);
        }
    }

    // 寻找生成位置
    findSpawnLocation(map) {
        // 首先检查城市地块
        const cityTile = map.getTile(this.q, this.r);
        if (cityTile && !cityTile.unit) {
            return cityTile;
        }

        // 检查相邻地块
        const neighbors = map.getNeighbors(this.q, this.r);
        for (const tile of neighbors) {
            if (tile && tile.canMoveTo()) {
                return tile;
            }
        }

        return null;
    }

    // 自动分配工作地块
    autoAssignTiles(map) {
        const maxTiles = Math.min(this.population, 6); // 最多工作6个地块
        const availableTiles = this.getAvailableWorkTiles(map);
        
        // 按产出价值排序
        availableTiles.sort((a, b) => {
            const valueA = a.yields.food * 2 + a.yields.production * 1.5 + a.yields.gold;
            const valueB = b.yields.food * 2 + b.yields.production * 1.5 + b.yields.gold;
            return valueB - valueA;
        });

        // 重新分配工作地块
        this.workingTiles = [{ q: this.q, r: this.r }]; // 保留城市中心
        
        for (let i = 0; i < Math.min(maxTiles - 1, availableTiles.length); i++) {
            const tile = availableTiles[i];
            this.workingTiles.push({ q: tile.q, r: tile.r });
        }
    }

    // 获取可工作的地块
    getAvailableWorkTiles(map) {
        const tiles = [];
        const range = 2; // 城市工作范围

        for (let q = this.q - range; q <= this.q + range; q++) {
            for (let r = this.r - range; r <= this.r + range; r++) {
                if (Math.abs(q - this.q) + Math.abs(r - this.r) <= range) {
                    const tile = map.getTile(q, r);
                    if (tile && tile.terrain !== 'water' && tile.terrain !== 'mountains') {
                        // 排除城市中心和已被其他城市工作的地块
                        if (!(q === this.q && r === this.r)) {
                            tiles.push(tile);
                        }
                    }
                }
            }
        }

        return tiles;
    }

    // 设置生产项目
    setProduction(item) {
        this.currentProduction = item;
        this.productionProgress = 0;
    }

    // 添加到生产队列
    addToQueue(item) {
        this.productionQueue.push(item);
    }

    // 获取生产成本
    getProductionCost(item) {
        const costs = {
            // 单位成本
            settler: 80,
            warrior: 40,
            worker: 60,
            scout: 30,
            archer: 50,
            
            // 建筑成本
            granary: 60,
            barracks: 80,
            library: 90,
            market: 100,
            walls: 120
        };

        return costs[item.unitType || item.buildingType] || 50;
    }

    // 获取单位名称
    getUnitName(unitType) {
        const names = {
            settler: '开拓者',
            warrior: '战士',
            worker: '工人',
            scout: '侦察兵',
            archer: '弓箭手'
        };
        return names[unitType] || unitType;
    }

    // 创建建筑
    createBuilding(buildingType) {
        const buildings = {
            granary: {
                type: 'granary',
                name: '粮仓',
                effects: { food: 2 }
            },
            barracks: {
                type: 'barracks',
                name: '兵营',
                effects: { production: 1 }
            },
            library: {
                type: 'library',
                name: '图书馆',
                effects: { science: 2 }
            },
            market: {
                type: 'market',
                name: '市场',
                effects: { gold: 2 }
            },
            walls: {
                type: 'walls',
                name: '城墙',
                effects: { defense: 5 }
            }
        };

        return buildings[buildingType] || { type: buildingType, name: buildingType, effects: {} };
    }

    // 获取城市颜色
    getColor() {
        const colors = {
            0: '#e74c3c', // 玩家 - 红色
            1: '#3498db', // AI1 - 蓝色
            2: '#2ecc71', // AI2 - 绿色
            3: '#f39c12'  // AI3 - 橙色
        };
        return colors[this.owner] || '#95a5a6';
    }

    // 渲染城市
    render(ctx, x, y) {
        const color = this.getColor();

        // 绘制城市背景
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();

        // 绘制城市边框
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 绘制城市图标
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏛️', x, y);

        // 绘制城市名称
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(this.name, x, y + 25);

        // 绘制人口
        ctx.fillStyle = '#7f8c8d';
        ctx.font = '10px Arial';
        ctx.fillText(`人口: ${this.population}`, x, y + 38);

        // 绘制生产进度条（如果有当前生产）
        if (this.currentProduction) {
            const barWidth = 30;
            const barHeight = 4;
            const progress = this.productionProgress / this.getProductionCost(this.currentProduction);

            // 背景
            ctx.fillStyle = '#34495e';
            ctx.fillRect(x - barWidth/2, y - 25, barWidth, barHeight);

            // 进度
            ctx.fillStyle = '#f39c12';
            ctx.fillRect(x - barWidth/2, y - 25, barWidth * Math.min(progress, 1), barHeight);
        }
    }

    // 获取城市信息
    getInfo() {
        return {
            name: this.name,
            population: this.population,
            size: this.size,
            food: this.food,
            production: this.production,
            culture: this.culture,
            science: this.science,
            gold: this.gold,
            buildings: this.buildings,
            currentProduction: this.currentProduction,
            productionProgress: this.productionProgress
        };
    }
}

// 城市管理器
class CityManager {
    constructor() {
        this.cities = [];
    }

    // 创建城市
    createCity(name, owner, q, r) {
        const city = new City(name, owner, q, r);
        this.cities.push(city);
        return city;
    }

    // 获取指定位置的城市
    getCityAt(q, r) {
        return this.cities.find(city => city.q === q && city.r === r);
    }

    // 获取玩家的所有城市
    getPlayerCities(playerId) {
        return this.cities.filter(city => city.owner === playerId);
    }

    // 处理所有城市的回合
    processTurn(map) {
        const totalYields = {
            food: 0,
            production: 0,
            gold: 0,
            science: 0,
            culture: 0
        };

        this.cities.forEach(city => {
            const yields = city.processTurn(map);
            Object.keys(yields).forEach(key => {
                if (totalYields.hasOwnProperty(key)) {
                    totalYields[key] += yields[key];
                }
            });
        });

        return totalYields;
    }

    // 获取城市总产出
    getTotalYields(map) {
        const totalYields = {
            food: 0,
            production: 0,
            gold: 0,
            science: 0,
            culture: 0
        };

        this.cities.forEach(city => {
            const yields = city.calculateYields(map);
            Object.keys(yields).forEach(key => {
                if (totalYields.hasOwnProperty(key)) {
                    totalYields[key] += yields[key];
                }
            });
        });

        return totalYields;
    }
}