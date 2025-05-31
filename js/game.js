// 主游戏类
class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.map = null;
        this.units = [];
        this.cities = [];
        this.players = [];
        this.currentPlayer = 0;
        this.turn = 1;
        this.gameState = 'playing'; // playing, paused, ended
        this.selectedUnit = null;
        this.selectedCity = null;
        this.hoveredTile = null;
        this.cameraX = 0;
        this.cameraY = 0;
        this.zoom = 1;
        this.messages = [];
        this.technology = new TechnologyTree();
        this.resources = {
            science: 0,
            culture: 0,
            gold: 100
        };
        this.unlockedUnits = ['settler', 'warrior', 'worker'];
        this.unlockedBuildings = ['granary'];
        this.unlockedImprovements = [];
        
        this.initializeGame();
    }

    // 初始化游戏
    async initializeGame() {
        // 创建玩家
        this.players = [
            { id: 0, name: '玩家', isHuman: true, color: '#e74c3c' },
            { id: 1, name: 'AI文明1', isHuman: false, color: '#3498db' },
            { id: 2, name: 'AI文明2', isHuman: false, color: '#2ecc71' }
        ];

        // 设置画布
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 调整画布大小
        this.resizeCanvas();
        
        // 显示加载界面
        this.showLoadingScreen();
        
        // 初始化纹理管理器
        this.textureManager = new TextureManager();
        const texturesLoaded = await this.textureManager.initialize();
        
        if (texturesLoaded) {
            this.addMessage('地形纹理加载完成！');
        } else {
            this.addMessage('纹理加载失败，使用基础渲染模式。');
        }

        // 创建更大的地图
        this.map = new HexagonMap(25, 20, 25);
        this.map.setTextureManager(this.textureManager);
        
        // 设置相机位置到地图中心
        this.cameraX = this.canvas.width / 2;
        this.cameraY = this.canvas.height / 2;
        
        // 创建初始单位和城市
        this.createStartingUnits();
        
        // 绑定事件
        this.bindEvents();
        
        // 隐藏加载界面
        this.hideLoadingScreen();
        
        // 开始游戏循环
        this.gameLoop();
        
        // 初始化UI
        this.updateUI();
        
        // 在调试模式下探索所有地块
        if (window.location.hash === '#debug') {
            this.map.tiles.forEach(tile => {
                tile.explored = true;
                tile.visible = true;
            });
            this.addMessage(`调试模式：地图已全部探索 (${this.map.tiles.length} 个地块)`);
            
            // 添加全局调试函数
            window.debugMap = () => {
                console.log('地图信息:');
                console.log('- 地块总数:', this.map.tiles.length);
                console.log('- 地图尺寸:', this.map.width, 'x', this.map.height);
                console.log('- 相机位置:', this.cameraX, this.cameraY);
                console.log('- 缩放级别:', this.zoom);
                console.log('- 六边形大小:', this.map.hexSize);
                
                const terrainCounts = {};
                this.map.tiles.forEach(tile => {
                    terrainCounts[tile.terrain] = (terrainCounts[tile.terrain] || 0) + 1;
                });
                console.log('- 地形分布:', terrainCounts);
            };
            
            // 自动调用调试函数
            window.debugMap();
        }
        
        this.addMessage('游戏开始！建立你的第一个城市吧。');
        this.addMessage('使用WASD或方向键移动相机，鼠标滚轮缩放。');
    }

    // 调整画布大小
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    // 显示加载界面
    showLoadingScreen() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-screen';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(44, 62, 80, 0.95);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            color: #ecf0f1;
        `;
        
        loadingDiv.innerHTML = `
            <div style="text-align: center;">
                <h2 style="margin-bottom: 20px;">正在生成世界...</h2>
                <div style="width: 300px; height: 20px; background: #34495e; border-radius: 10px; overflow: hidden;">
                    <div id="loading-progress" style="width: 0%; height: 100%; background: linear-gradient(90deg, #3498db, #2ecc71); transition: width 0.3s;"></div>
                </div>
                <p id="loading-text" style="margin-top: 10px;">初始化地形纹理...</p>
            </div>
        `;
        
        document.body.appendChild(loadingDiv);
        
        // 监听纹理加载进度
        const progressBar = document.getElementById('loading-progress');
        const loadingText = document.getElementById('loading-text');
        
        const updateProgress = () => {
            if (this.textureManager) {
                const progress = this.textureManager.getLoadProgress();
                progressBar.style.width = (progress.progress * 100) + '%';
                loadingText.textContent = `加载纹理 ${progress.loaded}/${progress.total}...`;
                
                if (!progress.isComplete) {
                    setTimeout(updateProgress, 100);
                }
            }
        };
        
        setTimeout(updateProgress, 100);
    }

    // 隐藏加载界面
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.remove();
            }, 500);
        }
    }

    // 创建初始单位
    createStartingUnits() {
        // 为每个玩家创建初始单位
        this.players.forEach((player, index) => {
            const startQ = (index - 1) * 8;
            const startR = (index - 1) * 6;
            
            // 创建开拓者
            const settler = new Unit('settler', player.id, startQ, startR);
            const settlerTile = this.map.getTile(startQ, startR);
            if (settlerTile) {
                settlerTile.unit = settler;
                this.units.push(settler);
            }
            
            // 创建战士
            const warrior = new Unit('warrior', player.id, startQ + 1, startR);
            const warriorTile = this.map.getTile(startQ + 1, startR);
            if (warriorTile) {
                warriorTile.unit = warrior;
                this.units.push(warrior);
            }
            
            // 探索起始区域
            settler.exploreArea(this.map);
            warrior.exploreArea(this.map);
        });
    }

    // 绑定事件
    bindEvents() {
        // 鼠标事件
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // UI事件
        document.getElementById('next-turn-btn').addEventListener('click', () => this.nextTurn());
        document.getElementById('regenerate-map-btn').addEventListener('click', () => this.regenerateMap());
        
        // 科技树事件
        document.querySelectorAll('.tech-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleTechClick(e));
        });
        
        // 建造按钮事件
        document.querySelectorAll('.build-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleBuildClick(e));
        });
        
        // 窗口大小变化
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    // 处理点击事件
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const clickedTile = this.map.getClickedTile(mouseX, mouseY, this.cameraX, this.cameraY);
        
        if (clickedTile) {
            // 如果点击的地块有单位
            if (clickedTile.unit && clickedTile.unit.owner === this.currentPlayer) {
                this.selectUnit(clickedTile.unit);
            }
            // 如果有选中的单位且点击的是空地块
            else if (this.selectedUnit && this.selectedUnit.owner === this.currentPlayer) {
                this.moveSelectedUnit(clickedTile.q, clickedTile.r);
            }
            // 如果点击的地块有城市
            else if (clickedTile.city && clickedTile.city.owner === this.currentPlayer) {
                this.selectCity(clickedTile.city);
            }
            
            this.updateTileInfo(clickedTile);
        }
    }

    // 处理鼠标移动
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        this.hoveredTile = this.map.getClickedTile(mouseX, mouseY, this.cameraX, this.cameraY);
    }

    // 处理滚轮事件（缩放）
    handleWheel(e) {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom = Math.max(0.5, Math.min(2, this.zoom * zoomFactor));
    }

    // 处理键盘事件
    handleKeyDown(e) {
        const moveSpeed = 20;
        
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
                this.cameraY += moveSpeed;
                break;
            case 'ArrowDown':
            case 's':
                this.cameraY -= moveSpeed;
                break;
            case 'ArrowLeft':
            case 'a':
                this.cameraX += moveSpeed;
                break;
            case 'ArrowRight':
            case 'd':
                this.cameraX -= moveSpeed;
                break;
            case 'Escape':
                this.deselectAll();
                break;
            case ' ':
                e.preventDefault();
                this.nextTurn();
                break;
        }
    }

    // 处理科技点击
    handleTechClick(e) {
        const techId = e.currentTarget.dataset.tech;
        if (this.technology.startResearch(techId)) {
            this.addMessage(`开始研究 ${this.technology.getTechInfo(techId).name}`);
            this.updateUI();
        }
    }

    // 处理建造点击
    handleBuildClick(e) {
        const buildType = e.currentTarget.dataset.build;
        
        if (this.selectedCity) {
            const item = { type: 'unit', unitType: buildType };
            this.selectedCity.setProduction(item);
            this.addMessage(`${this.selectedCity.name} 开始训练 ${this.getUnitDisplayName(buildType)}`);
            this.updateUI();
        }
    }

    // 选择单位
    selectUnit(unit) {
        if (this.selectedUnit) {
            this.selectedUnit.selected = false;
        }
        
        this.selectedUnit = unit;
        unit.selected = true;
        this.selectedCity = null;
        
        this.updateUnitInfo(unit);
    }

    // 选择城市
    selectCity(city) {
        this.selectedCity = city;
        if (this.selectedUnit) {
            this.selectedUnit.selected = false;
            this.selectedUnit = null;
        }
        
        this.updateCityInfo(city);
    }

    // 取消所有选择
    deselectAll() {
        if (this.selectedUnit) {
            this.selectedUnit.selected = false;
            this.selectedUnit = null;
        }
        this.selectedCity = null;
        this.updateUnitInfo(null);
        this.updateCityInfo(null);
    }

    // 移动选中的单位
    moveSelectedUnit(q, r) {
        if (this.selectedUnit && this.selectedUnit.moveTo(q, r, this.map)) {
            this.updateUnitInfo(this.selectedUnit);
        }
    }

    // 下一回合
    nextTurn() {
        // 处理当前玩家的回合结束
        this.endPlayerTurn();
        
        // 切换到下一个玩家
        this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
        
        // 如果回到第一个玩家，增加回合数
        if (this.currentPlayer === 0) {
            this.turn++;
        }
        
        // 开始新玩家的回合
        this.startPlayerTurn();
        
        this.updateUI();
    }

    // 结束玩家回合
    endPlayerTurn() {
        // 处理城市
        this.cities.filter(city => city.owner === this.currentPlayer).forEach(city => {
            const yields = city.processTurn(this.map);
            
            // 累积资源
            if (this.currentPlayer === 0) { // 只为人类玩家累积资源
                this.resources.science += yields.science;
                this.resources.culture += yields.culture;
                this.resources.gold += yields.gold;
            }
        });
        
        // 处理科技研究
        if (this.currentPlayer === 0) {
            this.technology.addScience(this.getSciencePerTurn());
        }
    }

    // 开始玩家回合
    startPlayerTurn() {
        // 恢复所有单位的移动点数
        this.units.filter(unit => unit.owner === this.currentPlayer).forEach(unit => {
            unit.newTurn();
        });
        
        // AI玩家自动行动
        if (!this.players[this.currentPlayer].isHuman) {
            setTimeout(() => this.processAITurn(), 1000);
        }
    }

    // 处理AI回合
    processAITurn() {
        const aiUnits = this.units.filter(unit => unit.owner === this.currentPlayer);
        
        aiUnits.forEach(unit => {
            // 简单的AI逻辑
            if (unit.type === 'settler' && Math.random() < 0.3) {
                // 30%概率建立城市
                unit.foundCity(this.map, `AI城市${this.cities.length + 1}`);
            } else if (unit.movementPoints > 0) {
                // 随机移动
                const neighbors = this.map.getNeighbors(unit.q, unit.r);
                const validMoves = neighbors.filter(tile => tile && tile.canMoveTo());
                
                if (validMoves.length > 0) {
                    const randomTile = validMoves[Math.floor(Math.random() * validMoves.length)];
                    unit.moveTo(randomTile.q, randomTile.r, this.map);
                }
            }
        });
        
        // AI回合结束后自动进入下一回合
        setTimeout(() => this.nextTurn(), 500);
    }

    // 获取每回合科学点数
    getSciencePerTurn() {
        let science = 0;
        this.cities.filter(city => city.owner === 0).forEach(city => {
            const yields = city.calculateYields(this.map);
            science += yields.science;
        });
        return science;
    }

    // 游戏循环
    gameLoop() {
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    // 渲染游戏
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 保存上下文状态
        this.ctx.save();
        
        // 应用缩放和相机位置
        this.ctx.scale(this.zoom, this.zoom);
        
        // 渲染地图
        this.map.render(this.ctx, this.cameraX, this.cameraY);
        
        // 渲染选中单位的可移动区域
        if (this.selectedUnit && this.selectedUnit.owner === this.currentPlayer) {
            this.renderValidMoves();
        }
        
        // 渲染悬停效果
        if (this.hoveredTile) {
            this.renderHoverEffect();
        }
        
        // 恢复上下文状态
        this.ctx.restore();
    }

    // 渲染可移动区域
    renderValidMoves() {
        const validMoves = this.selectedUnit.getValidMoves(this.map);
        
        validMoves.forEach(move => {
            const pixel = this.map.hexToPixel(move.q, move.r);
            this.ctx.fillStyle = 'rgba(241, 196, 15, 0.3)';
            this.map.drawHexagon(this.ctx, 
                pixel.x + this.cameraX, 
                pixel.y + this.cameraY, 
                this.map.hexSize, 
                'rgba(241, 196, 15, 0.3)', 
                '#f1c40f'
            );
        });
    }

    // 渲染悬停效果
    renderHoverEffect() {
        const pixel = this.map.hexToPixel(this.hoveredTile.q, this.hoveredTile.r);
        this.map.drawHexagon(this.ctx, 
            pixel.x + this.cameraX, 
            pixel.y + this.cameraY, 
            this.map.hexSize, 
            'rgba(255, 255, 255, 0.2)', 
            '#fff'
        );
    }

    // 更新UI
    updateUI() {
        // 更新回合信息
        document.getElementById('turn-counter').textContent = `回合: ${this.turn}`;
        
        // 更新资源
        document.getElementById('science-points').textContent = Math.floor(this.resources.science);
        document.getElementById('culture-points').textContent = Math.floor(this.resources.culture);
        document.getElementById('gold').textContent = Math.floor(this.resources.gold);
        
        // 更新科技树
        this.updateTechTree();
        
        // 更新城市列表
        this.updateCitiesList();
        
        // 更新建造选项
        this.updateBuildOptions();
    }

    // 更新科技树UI
    updateTechTree() {
        const techItems = document.querySelectorAll('.tech-item');
        
        techItems.forEach(item => {
            const techId = item.dataset.tech;
            const tech = this.technology.getTechInfo(techId);
            
            if (tech) {
                item.classList.remove('researched', 'researching');
                
                if (tech.researched) {
                    item.classList.add('researched');
                } else if (this.technology.currentResearch === tech) {
                    item.classList.add('researching');
                }
                
                // 更新成本显示
                const costElement = item.querySelector('.tech-cost');
                if (costElement) {
                    if (this.technology.currentResearch === tech) {
                        const progress = Math.floor(this.technology.getResearchProgress() * 100);
                        costElement.textContent = `${progress}%`;
                    } else {
                        costElement.textContent = `${tech.cost} 科技`;
                    }
                }
            }
        });
    }

    // 更新城市列表
    updateCitiesList() {
        const citiesList = document.getElementById('cities-list');
        const playerCities = this.cities.filter(city => city.owner === 0);
        
        citiesList.innerHTML = '';
        
        playerCities.forEach(city => {
            const cityElement = document.createElement('div');
            cityElement.className = 'city-item';
            cityElement.innerHTML = `
                <div class="city-name">${city.name}</div>
                <div class="city-stats">人口: ${city.population}</div>
            `;
            
            cityElement.addEventListener('click', () => {
                this.selectCity(city);
                // 移动相机到城市
                const pixel = this.map.hexToPixel(city.q, city.r);
                this.cameraX = this.canvas.width / 2 - pixel.x;
                this.cameraY = this.canvas.height / 2 - pixel.y;
            });
            
            citiesList.appendChild(cityElement);
        });
    }

    // 更新建造选项
    updateBuildOptions() {
        const buildButtons = document.querySelectorAll('.build-btn');
        
        buildButtons.forEach(btn => {
            const buildType = btn.dataset.build;
            btn.disabled = !this.unlockedUnits.includes(buildType) || !this.selectedCity;
        });
    }

    // 更新单位信息
    updateUnitInfo(unit) {
        const selectedUnitDiv = document.getElementById('selected-unit');
        
        if (unit) {
            const info = unit.getInfo();
            selectedUnitDiv.innerHTML = `
                <div class="unit-info">
                    <div class="unit-name">${this.getUnitDisplayName(info.type)}</div>
                    <div class="unit-stats">
                        生命值: ${info.health}/${info.maxHealth}<br>
                        力量: ${info.strength}<br>
                        移动: ${info.movementPoints}/${info.maxMovementPoints}
                    </div>
                </div>
            `;
        } else {
            selectedUnitDiv.innerHTML = '<p>点击地图上的单位来选择</p>';
        }
    }

    // 更新城市信息
    updateCityInfo(city) {
        // 这里可以添加城市详细信息的显示
        if (city) {
            console.log('选中城市:', city.name);
        }
    }

    // 更新地块信息
    updateTileInfo(tile) {
        const tileInfoDiv = document.getElementById('tile-info');
        
        if (tile) {
            const yields = tile.yields;
            tileInfoDiv.innerHTML = `
                <div class="tile-info">
                    <div class="tile-type">${this.getTerrainDisplayName(tile.terrain)}</div>
                    <div class="tile-yields">
                        食物: ${yields.food}<br>
                        生产: ${yields.production}<br>
                        金币: ${yields.gold}
                    </div>
                    ${tile.resource ? `<div>资源: ${tile.resource.type}</div>` : ''}
                </div>
            `;
        } else {
            tileInfoDiv.innerHTML = '<p>点击地图查看地块详情</p>';
        }
    }

    // 获取单位显示名称
    getUnitDisplayName(unitType) {
        const names = {
            settler: '开拓者',
            warrior: '战士',
            worker: '工人',
            scout: '侦察兵',
            archer: '弓箭手'
        };
        return names[unitType] || unitType;
    }

    // 获取地形显示名称
    getTerrainDisplayName(terrain) {
        const names = {
            grassland: '草原',
            plains: '平原',
            forest: '森林',
            hills: '丘陵',
            mountains: '山脉',
            water: '水域'
        };
        return names[terrain] || terrain;
    }

    // 重新生成地图
    async regenerateMap() {
        // 直接重新生成地图，不需要确认对话框
        this.addMessage('正在生成新世界...');
        
        // 显示加载界面
        this.showLoadingScreen();
        
        // 清除现有数据
        this.units = [];
        this.cities = [];
        this.turn = 1;
        this.currentPlayer = 0;
        this.selectedUnit = null;
        this.selectedCity = null;
        this.resources = {
            science: 0,
            culture: 0,
            gold: 100
        };
        
        // 重新生成地图
        this.map = new HexagonMap(25, 20, 25);
        this.map.setTextureManager(this.textureManager);
        
        // 重新创建初始单位
        this.createStartingUnits();
        
        // 重置相机位置
        this.cameraX = this.canvas.width / 2;
        this.cameraY = this.canvas.height / 2;
        this.zoom = 1;
        
        // 在调试模式下探索所有地块
        if (window.location.hash === '#debug') {
            this.map.tiles.forEach(tile => {
                tile.explored = true;
                tile.visible = true;
            });
        }
        
        // 隐藏加载界面
        this.hideLoadingScreen();
        
        // 更新UI
        this.updateUI();
        
        this.addMessage('新世界已生成！开始你的新征程吧。');
    }

    // 添加游戏消息
    addMessage(message) {
        this.messages.push({
            text: message,
            timestamp: Date.now()
        });
        
        // 限制消息数量
        if (this.messages.length > 50) {
            this.messages.shift();
        }
        
        // 更新消息显示
        const messagesDiv = document.getElementById('game-messages');
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        messagesDiv.appendChild(messageElement);
        
        // 滚动到底部
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        // 限制显示的消息数量
        while (messagesDiv.children.length > 10) {
            messagesDiv.removeChild(messagesDiv.firstChild);
        }
    }
}