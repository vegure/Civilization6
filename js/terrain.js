// 地形生成系统
class TerrainGenerator {
    constructor(seed = Math.random()) {
        this.seed = seed;
        this.noise = new SimplexNoise(seed);
        this.continentNoise = new SimplexNoise(seed * 2);
        this.detailNoise = new SimplexNoise(seed * 3);
        
        // 地形生成参数
        this.seaLevel = -0.2;
        this.mountainLevel = 0.5;
        this.hillLevel = 0.2;
        this.temperatureScale = 0.05;
        this.moistureScale = 0.08;
        this.elevationScale = 0.06;
        this.continentScale = 0.02;
    }

    // 生成地形类型
    generateTerrain(q, r, s) {
        // 计算距离中心的距离（用于大陆形状）
        const distanceFromCenter = Math.sqrt(q * q + r * r) / 20;
        
        // 使用多层噪声生成更真实的地形
        const continentShape = this.continentNoise.noise2D(q * this.continentScale, r * this.continentScale);
        const elevation = this.noise.noise2D(q * this.elevationScale, r * this.elevationScale);
        const moisture = this.noise.noise2D((q + 1000) * this.moistureScale, (r + 1000) * this.moistureScale);
        const temperature = this.noise.noise2D((q + 2000) * this.temperatureScale, (r + 2000) * this.temperatureScale);
        const detail = this.detailNoise.noise2D(q * 0.15, r * 0.15);
        
        // 组合噪声值
        let finalElevation = elevation * 0.6 + continentShape * 0.4 + detail * 0.1;
        
        // 应用距离衰减（让边缘更可能是海洋）
        finalElevation -= Math.max(0, distanceFromCenter - 0.7) * 2;
        
        // 根据海拔、湿度和温度决定地形
        if (finalElevation < this.seaLevel) {
            return 'water';
        } else if (finalElevation > this.mountainLevel) {
            return 'mountains';
        } else if (finalElevation > this.hillLevel) {
            // 丘陵区域
            if (moisture > 0.2 && temperature > 0.0) {
                return 'forest';
            } else {
                return 'hills';
            }
        } else {
            // 平地区域
            if (temperature < -0.4) {
                return moisture > 0.0 ? 'tundra' : 'snow';
            } else if (temperature > 0.4 && moisture < -0.3) {
                return 'desert';
            } else if (moisture > 0.3 && temperature > -0.1) {
                return 'forest';
            } else if (moisture < -0.2) {
                return 'plains';
            } else {
                return 'grassland';
            }
        }
    }

    // 生成资源
    generateResource(terrain, q, r) {
        const resourceNoise = this.noise.noise2D(q * 0.05, r * 0.05);
        
        // 不同地形有不同的资源概率
        const resourceChances = {
            grassland: { wheat: 0.25, horses: 0.08, cattle: 0.12 },
            plains: { wheat: 0.18, horses: 0.12, sheep: 0.15 },
            forest: { deer: 0.2, furs: 0.1, lumber: 0.15 },
            hills: { iron: 0.2, stone: 0.25, gold: 0.08, copper: 0.12 },
            mountains: { gold: 0.15, gems: 0.08, stone: 0.25, silver: 0.1 },
            water: { fish: 0.35, pearls: 0.05, whales: 0.08 },
            desert: { oil: 0.1, gems: 0.05, salt: 0.15 },
            tundra: { furs: 0.2, deer: 0.15, iron: 0.1 },
            snow: { oil: 0.08, furs: 0.12 }
        };

        const chances = resourceChances[terrain] || {};
        
        // 使用噪声值决定是否生成资源
        if (resourceNoise > 0.35) {
            const resourceTypes = Object.keys(chances);
            for (const resourceType of resourceTypes) {
                if (Math.random() < chances[resourceType]) {
                    return this.createResource(resourceType);
                }
            }
        }
        
        return null;
    }

    // 创建资源对象
    createResource(type) {
        const resources = {
            // 食物资源
            wheat: { type: 'wheat', color: '#f1c40f', yields: { food: 1 }, emoji: '🌾' },
            cattle: { type: 'cattle', color: '#8b4513', yields: { food: 1 }, emoji: '🐄' },
            sheep: { type: 'sheep', color: '#f8f9fa', yields: { food: 1 }, emoji: '🐑' },
            deer: { type: 'deer', color: '#d2691e', yields: { food: 1 }, emoji: '🦌' },
            fish: { type: 'fish', color: '#3498db', yields: { food: 2 }, emoji: '🐟' },
            whales: { type: 'whales', color: '#2980b9', yields: { food: 1, gold: 1 }, emoji: '🐋' },
            
            // 生产资源
            horses: { type: 'horses', color: '#8b4513', yields: { production: 1 }, emoji: '🐎' },
            iron: { type: 'iron', color: '#95a5a6', yields: { production: 2 }, emoji: '⚒️' },
            stone: { type: 'stone', color: '#7f8c8d', yields: { production: 1 }, emoji: '🗿' },
            copper: { type: 'copper', color: '#cd7f32', yields: { production: 1 }, emoji: '🔶' },
            lumber: { type: 'lumber', color: '#8b4513', yields: { production: 1 }, emoji: '🪵' },
            
            // 奢侈品资源
            gold: { type: 'gold', color: '#f39c12', yields: { gold: 3 }, emoji: '💰' },
            gems: { type: 'gems', color: '#9b59b6', yields: { gold: 2 }, emoji: '💎' },
            pearls: { type: 'pearls', color: '#ecf0f1', yields: { gold: 2 }, emoji: '🦪' },
            furs: { type: 'furs', color: '#654321', yields: { gold: 2 }, emoji: '🦫' },
            silver: { type: 'silver', color: '#c0c0c0', yields: { gold: 2 }, emoji: '🥈' },
            salt: { type: 'salt', color: '#ffffff', yields: { food: 1, gold: 1 }, emoji: '🧂' },
            
            // 战略资源
            oil: { type: 'oil', color: '#2c3e50', yields: { production: 1, gold: 1 }, emoji: '🛢️' }
        };
        
        return resources[type] || null;
    }
}

// 简化的Simplex噪声实现
class SimplexNoise {
    constructor(seed = Math.random()) {
        this.seed = seed;
        this.p = this.buildPermutationTable();
    }

    buildPermutationTable() {
        const p = new Array(512);
        const permutation = [];
        
        // 生成0-255的排列
        for (let i = 0; i < 256; i++) {
            permutation[i] = i;
        }
        
        // 使用种子打乱排列
        let seed = this.seed * 65536;
        for (let i = 255; i > 0; i--) {
            seed = (seed * 9301 + 49297) % 233280;
            const j = Math.floor((seed / 233280) * (i + 1));
            [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
        }
        
        // 复制到512长度的数组
        for (let i = 0; i < 512; i++) {
            p[i] = permutation[i % 256];
        }
        
        return p;
    }

    // 2D噪声函数
    noise2D(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        
        x -= Math.floor(x);
        y -= Math.floor(y);
        
        const u = this.fade(x);
        const v = this.fade(y);
        
        const A = this.p[X] + Y;
        const AA = this.p[A];
        const AB = this.p[A + 1];
        const B = this.p[X + 1] + Y;
        const BA = this.p[B];
        const BB = this.p[B + 1];
        
        return this.lerp(v,
            this.lerp(u, this.grad(this.p[AA], x, y), this.grad(this.p[BA], x - 1, y)),
            this.lerp(u, this.grad(this.p[AB], x, y - 1), this.grad(this.p[BB], x - 1, y - 1))
        );
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(t, a, b) {
        return a + t * (b - a);
    }

    grad(hash, x, y) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
}

// 地形改良系统
class TerrainImprovement {
    constructor(type, tile) {
        this.type = type;
        this.tile = tile;
        this.turnsToComplete = this.getConstructionTime();
        this.completed = false;
        this.yields = this.getYieldBonus();
    }

    // 获取建造时间
    getConstructionTime() {
        const times = {
            farm: 3,
            mine: 4,
            pasture: 3,
            road: 2,
            trading_post: 4,
            lumber_mill: 4
        };
        return times[this.type] || 3;
    }

    // 获取产出加成
    getYieldBonus() {
        const bonuses = {
            farm: { food: 1 },
            mine: { production: 1 },
            pasture: { food: 1 },
            road: { movement: 0.5 },
            trading_post: { gold: 1 },
            lumber_mill: { production: 1 }
        };
        return bonuses[this.type] || {};
    }

    // 检查是否可以建造
    static canBuild(type, tile) {
        const requirements = {
            farm: ['grassland', 'plains'],
            mine: ['hills', 'mountains'],
            pasture: ['grassland', 'plains'],
            road: ['grassland', 'plains', 'hills'],
            trading_post: ['grassland', 'plains', 'forest'],
            lumber_mill: ['forest']
        };
        
        const validTerrains = requirements[type] || [];
        return validTerrains.includes(tile.terrain);
    }

    // 完成建造
    complete() {
        this.completed = true;
        
        // 应用产出加成到地块
        Object.keys(this.yields).forEach(yieldType => {
            if (this.tile.yields[yieldType] !== undefined) {
                this.tile.yields[yieldType] += this.yields[yieldType];
            }
        });
    }

    // 获取改良设施图标
    getIcon() {
        const icons = {
            farm: '🌾',
            mine: '⛏️',
            pasture: '🐄',
            road: '🛤️',
            trading_post: '🏪',
            lumber_mill: '🏭'
        };
        return icons[this.type] || '🔧';
    }

    // 渲染改良设施
    render(ctx, x, y) {
        if (!this.completed) return;
        
        const icon = this.getIcon();
        
        // 绘制背景圆圈
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(x + 15, y - 15, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制图标
        ctx.fillStyle = '#2c3e50';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, x + 15, y - 15);
    }
}

// 地形特征系统
class TerrainFeature {
    constructor(type) {
        this.type = type;
        this.movementCost = this.getMovementCost();
        this.defenseBonus = this.getDefenseBonus();
        this.yields = this.getYields();
    }

    // 获取移动消耗
    getMovementCost() {
        const costs = {
            forest: 2,
            jungle: 2,
            marsh: 2,
            oasis: 1,
            floodplains: 1
        };
        return costs[this.type] || 1;
    }

    // 获取防御加成
    getDefenseBonus() {
        const bonuses = {
            forest: 25,
            jungle: 25,
            marsh: -25,
            hills: 25,
            mountains: 50
        };
        return bonuses[this.type] || 0;
    }

    // 获取产出
    getYields() {
        const yields = {
            forest: { production: 1 },
            jungle: { food: 1 },
            marsh: { food: -1 },
            oasis: { food: 3, gold: 1 },
            floodplains: { food: 2 }
        };
        return yields[this.type] || {};
    }

    // 获取特征图标
    getIcon() {
        const icons = {
            forest: '🌲',
            jungle: '🌴',
            marsh: '🌿',
            oasis: '🏝️',
            floodplains: '🌊'
        };
        return icons[this.type] || '';
    }
}

// 河流系统
class RiverSystem {
    constructor(map) {
        this.map = map;
        this.rivers = [];
        this.generateRivers();
    }

    // 生成河流
    generateRivers() {
        const numRivers = Math.floor(this.map.width * this.map.height * 0.02);
        
        for (let i = 0; i < numRivers; i++) {
            this.generateRiver();
        }
    }

    // 生成单条河流
    generateRiver() {
        // 从地图边缘开始
        const startTile = this.getRandomEdgeTile();
        if (!startTile) return;
        
        const river = {
            id: Math.random().toString(36).substr(2, 9),
            tiles: [startTile],
            length: 0
        };
        
        let currentTile = startTile;
        const maxLength = 20;
        
        while (river.length < maxLength) {
            const nextTile = this.getNextRiverTile(currentTile, river.tiles);
            if (!nextTile) break;
            
            river.tiles.push(nextTile);
            river.length++;
            currentTile = nextTile;
            
            // 河流流向水域时停止
            if (nextTile.terrain === 'water') break;
        }
        
        if (river.length > 3) {
            this.rivers.push(river);
            this.applyRiverEffects(river);
        }
    }

    // 获取随机边缘地块
    getRandomEdgeTile() {
        const edgeTiles = this.map.tiles.filter(tile => {
            return Math.abs(tile.q) === this.map.width || 
                   Math.abs(tile.r) === this.map.height;
        });
        
        return edgeTiles[Math.floor(Math.random() * edgeTiles.length)];
    }

    // 获取下一个河流地块
    getNextRiverTile(currentTile, existingTiles) {
        const neighbors = this.map.getNeighbors(currentTile.q, currentTile.r);
        const validNeighbors = neighbors.filter(tile => {
            return tile && 
                   !existingTiles.includes(tile) &&
                   tile.terrain !== 'mountains';
        });
        
        if (validNeighbors.length === 0) return null;
        
        // 优先选择海拔较低的地块
        validNeighbors.sort((a, b) => {
            const elevationA = this.getTileElevation(a);
            const elevationB = this.getTileElevation(b);
            return elevationA - elevationB;
        });
        
        return validNeighbors[0];
    }

    // 获取地块海拔（简化）
    getTileElevation(tile) {
        const elevations = {
            water: 0,
            grassland: 1,
            plains: 1,
            forest: 2,
            hills: 3,
            mountains: 4
        };
        return elevations[tile.terrain] || 1;
    }

    // 应用河流效果
    applyRiverEffects(river) {
        river.tiles.forEach(tile => {
            if (tile.terrain !== 'water') {
                tile.hasRiver = true;
                tile.yields.food += 1; // 河流提供额外食物
                tile.yields.gold += 1; // 河流提供贸易收入
            }
        });
    }

    // 渲染河流
    render(ctx, offsetX, offsetY) {
        this.rivers.forEach(river => {
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            river.tiles.forEach((tile, index) => {
                const pixel = this.map.hexToPixel(tile.q, tile.r);
                const x = pixel.x + offsetX;
                const y = pixel.y + offsetY;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
        });
    }
}