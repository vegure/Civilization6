// 六边形地图系统
class HexagonMap {
    constructor(width, height, hexSize = 30) {
        this.width = width;
        this.height = height;
        this.hexSize = hexSize;
        this.hexWidth = hexSize * 2;
        this.hexHeight = Math.sqrt(3) * hexSize;
        this.tiles = [];
        this.generateMap();
    }

    // 生成地图
    generateMap() {
        const terrainGen = new TerrainGenerator();
        
        for (let q = -this.width; q <= this.width; q++) {
            const r1 = Math.max(-this.height, -q - this.height);
            const r2 = Math.min(this.height, -q + this.height);
            for (let r = r1; r <= r2; r++) {
                const s = -q - r;
                const tile = new HexTile(q, r, s, terrainGen);
                this.tiles.push(tile);
            }
        }
        
        // 生成河流系统
        this.riverSystem = new RiverSystem(this);
    }

    // 立方体坐标转换为像素坐标
    hexToPixel(q, r) {
        const x = this.hexSize * (3/2 * q);
        const y = this.hexSize * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
        return { x, y };
    }

    // 像素坐标转换为立方体坐标
    pixelToHex(x, y) {
        const q = (2/3 * x) / this.hexSize;
        const r = (-1/3 * x + Math.sqrt(3)/3 * y) / this.hexSize;
        return this.hexRound(q, r, -q - r);
    }

    // 六边形坐标四舍五入
    hexRound(q, r, s) {
        let rq = Math.round(q);
        let rr = Math.round(r);
        let rs = Math.round(s);

        const qDiff = Math.abs(rq - q);
        const rDiff = Math.abs(rr - r);
        const sDiff = Math.abs(rs - s);

        if (qDiff > rDiff && qDiff > sDiff) {
            rq = -rr - rs;
        } else if (rDiff > sDiff) {
            rr = -rq - rs;
        } else {
            rs = -rq - rr;
        }

        return { q: rq, r: rr, s: rs };
    }

    // 获取指定坐标的地块
    getTile(q, r) {
        return this.tiles.find(tile => tile.q === q && tile.r === r);
    }

    // 获取相邻地块
    getNeighbors(q, r) {
        const directions = [
            { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
            { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
        ];
        
        return directions.map(dir => this.getTile(q + dir.q, r + dir.r))
                        .filter(tile => tile !== undefined);
    }

    // 计算两个六边形之间的距离
    hexDistance(q1, r1, q2, r2) {
        return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
    }

    // 绘制六边形
    drawHexagon(ctx, x, y, size, fillColor, strokeColor = '#2c3e50') {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const hexX = x + size * Math.cos(angle);
            const hexY = y + size * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(hexX, hexY);
            } else {
                ctx.lineTo(hexX, hexY);
            }
        }
        ctx.closePath();
        
        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fill();
        }
        
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // 渲染整个地图
    render(ctx, offsetX = 0, offsetY = 0) {
        ctx.save();
        ctx.translate(offsetX, offsetY);

        this.tiles.forEach(tile => {
            // 只渲染已探索的地块
            if (!tile.explored && !window.DEBUG_MODE) return;
            
            const pixel = this.hexToPixel(tile.q, tile.r);
            const color = tile.getTerrainColor();
            
            this.drawHexagon(ctx, pixel.x, pixel.y, this.hexSize, color);
            
            // 如果地块未被当前玩家看见，添加迷雾效果
            if (!tile.visible && !window.DEBUG_MODE) {
                this.drawHexagon(ctx, pixel.x, pixel.y, this.hexSize, 'rgba(0, 0, 0, 0.5)');
            }
            
            // 绘制河流标记
            if (tile.hasRiver) {
                ctx.fillStyle = '#3498db';
                ctx.beginPath();
                ctx.arc(pixel.x - 10, pixel.y + 10, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // 绘制资源
            if (tile.resource && (tile.visible || window.DEBUG_MODE)) {
                ctx.fillStyle = tile.resource.color;
                ctx.beginPath();
                ctx.arc(pixel.x, pixel.y, 8, 0, Math.PI * 2);
                ctx.fill();
                
                // 绘制资源边框
                ctx.strokeStyle = '#2c3e50';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // 绘制改良设施
            if (tile.improvement && (tile.visible || window.DEBUG_MODE)) {
                tile.improvement.render(ctx, pixel.x, pixel.y);
            }

            // 绘制单位
            if (tile.unit && (tile.visible || window.DEBUG_MODE)) {
                tile.unit.render(ctx, pixel.x, pixel.y);
            }

            // 绘制城市
            if (tile.city && (tile.visible || window.DEBUG_MODE)) {
                tile.city.render(ctx, pixel.x, pixel.y);
            }

            // 绘制坐标（调试用）
            if (window.DEBUG_MODE) {
                ctx.fillStyle = '#fff';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${tile.q},${tile.r}`, pixel.x, pixel.y - 15);
                
                // 显示产出信息
                ctx.font = '8px Arial';
                ctx.fillText(`F:${tile.yields.food} P:${tile.yields.production} G:${tile.yields.gold}`, pixel.x, pixel.y + 15);
            }
        });

        // 渲染河流
        if (this.riverSystem) {
            this.riverSystem.render(ctx, 0, 0);
        }

        ctx.restore();
    }

    // 获取鼠标点击的地块
    getClickedTile(mouseX, mouseY, offsetX = 0, offsetY = 0) {
        const adjustedX = mouseX - offsetX;
        const adjustedY = mouseY - offsetY;
        const hex = this.pixelToHex(adjustedX, adjustedY);
        return this.getTile(hex.q, hex.r);
    }
}

// 六边形地块类
class HexTile {
    constructor(q, r, s, terrainGenerator = null) {
        this.q = q;
        this.r = r;
        this.s = s;
        this.terrain = terrainGenerator ? terrainGenerator.generateTerrain(q, r, s) : this.generateTerrain();
        this.resource = terrainGenerator ? terrainGenerator.generateResource(this.terrain, q, r) : this.generateResource();
        this.unit = null;
        this.city = null;
        this.explored = false;
        this.visible = false;
        this.hasRiver = false;
        this.improvement = null;
        this.feature = null;
        this.yields = this.calculateYields();
    }

    // 生成地形
    generateTerrain() {
        const terrains = [
            { type: 'grassland', weight: 30 },
            { type: 'plains', weight: 25 },
            { type: 'forest', weight: 20 },
            { type: 'hills', weight: 15 },
            { type: 'mountains', weight: 5 },
            { type: 'water', weight: 5 }
        ];

        const random = Math.random() * 100;
        let cumulative = 0;
        
        for (const terrain of terrains) {
            cumulative += terrain.weight;
            if (random <= cumulative) {
                return terrain.type;
            }
        }
        
        return 'grassland';
    }

    // 生成资源
    generateResource() {
        if (Math.random() < 0.3) { // 30%概率有资源
            const resources = [
                { type: 'wheat', color: '#f1c40f' },
                { type: 'iron', color: '#95a5a6' },
                { type: 'gold', color: '#f39c12' },
                { type: 'stone', color: '#7f8c8d' },
                { type: 'horses', color: '#8b4513' }
            ];
            return resources[Math.floor(Math.random() * resources.length)];
        }
        return null;
    }

    // 获取地形颜色
    getTerrainColor() {
        const colors = {
            grassland: '#27ae60',
            plains: '#f1c40f',
            forest: '#2d5016',
            hills: '#8b4513',
            mountains: '#7f8c8d',
            water: '#3498db'
        };
        return colors[this.terrain] || '#27ae60';
    }

    // 计算地块产出
    calculateYields() {
        const baseYields = {
            grassland: { food: 2, production: 0, gold: 0 },
            plains: { food: 1, production: 1, gold: 0 },
            forest: { food: 1, production: 1, gold: 0 },
            hills: { food: 0, production: 2, gold: 0 },
            mountains: { food: 0, production: 0, gold: 1 },
            water: { food: 1, production: 0, gold: 2 }
        };

        let yields = { ...baseYields[this.terrain] };

        // 资源加成
        if (this.resource && this.resource.yields) {
            Object.keys(this.resource.yields).forEach(key => {
                if (yields[key] !== undefined) {
                    yields[key] += this.resource.yields[key];
                }
            });
        }

        // 河流加成
        if (this.hasRiver) {
            yields.food += 1;
            yields.gold += 1;
        }

        // 改良设施加成
        if (this.improvement && this.improvement.completed) {
            Object.keys(this.improvement.yields).forEach(key => {
                if (yields[key] !== undefined) {
                    yields[key] += this.improvement.yields[key];
                }
            });
        }

        // 地形特征加成
        if (this.feature) {
            Object.keys(this.feature.yields).forEach(key => {
                if (yields[key] !== undefined) {
                    yields[key] += this.feature.yields[key];
                }
            });
        }

        // 确保产出不为负数
        Object.keys(yields).forEach(key => {
            yields[key] = Math.max(0, yields[key]);
        });

        return yields;
    }

    // 检查是否可以建造城市
    canBuildCity() {
        return !this.city && this.terrain !== 'water' && this.terrain !== 'mountains';
    }

    // 检查是否可以移动到此地块
    canMoveTo() {
        return this.terrain !== 'mountains' && !this.unit;
    }

    // 获取移动消耗
    getMovementCost() {
        const costs = {
            grassland: 1,
            plains: 1,
            forest: 2,
            hills: 2,
            mountains: 999, // 不可通过
            water: 999 // 需要船只
        };
        return costs[this.terrain] || 1;
    }
}