// 主入口文件
let game;

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', function() {
    console.log('文明时代游戏启动中...');
    
    try {
        // 创建游戏实例
        game = new Game();
        
        // 将游戏实例设为全局变量，方便其他模块访问
        window.game = game;
        
        console.log('游戏初始化完成！');
        
        // 添加调试功能
        if (window.location.hash === '#debug') {
            window.DEBUG_MODE = true;
            console.log('调试模式已启用');
            
            // 添加调试控制台命令
            window.debugCommands = {
                addGold: (amount) => {
                    game.resources.gold += amount;
                    game.updateUI();
                    console.log(`添加了 ${amount} 金币`);
                },
                
                addScience: (amount) => {
                    game.resources.science += amount;
                    game.technology.addScience(amount);
                    game.updateUI();
                    console.log(`添加了 ${amount} 科学点数`);
                },
                
                createUnit: (type, q, r) => {
                    const unit = new Unit(type, 0, q || 0, r || 0);
                    const tile = game.map.getTile(q || 0, r || 0);
                    if (tile && !tile.unit) {
                        tile.unit = unit;
                        game.units.push(unit);
                        console.log(`在 (${q || 0}, ${r || 0}) 创建了 ${type}`);
                    } else {
                        console.log('无法在指定位置创建单位');
                    }
                },
                
                revealMap: () => {
                    game.map.tiles.forEach(tile => {
                        tile.explored = true;
                        tile.visible = true;
                    });
                    console.log('地图已全部探索');
                },
                
                nextTurn: (count = 1) => {
                    for (let i = 0; i < count; i++) {
                        game.nextTurn();
                    }
                    console.log(`跳过了 ${count} 回合`);
                },
                
                help: () => {
                    console.log('可用的调试命令:');
                    console.log('debugCommands.addGold(amount) - 添加金币');
                    console.log('debugCommands.addScience(amount) - 添加科学点数');
                    console.log('debugCommands.createUnit(type, q, r) - 创建单位');
                    console.log('debugCommands.revealMap() - 揭示整个地图');
                    console.log('debugCommands.nextTurn(count) - 跳过回合');
                    console.log('debugCommands.help() - 显示帮助');
                }
            };
            
            console.log('调试命令已加载，输入 debugCommands.help() 查看可用命令');
        }
        
    } catch (error) {
        console.error('游戏初始化失败:', error);
        
        // 显示错误信息给用户
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #e74c3c;
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            z-index: 1000;
        `;
        errorDiv.innerHTML = `
            <h3>游戏加载失败</h3>
            <p>请刷新页面重试</p>
            <p style="font-size: 12px; margin-top: 10px;">错误信息: ${error.message}</p>
        `;
        document.body.appendChild(errorDiv);
    }
});

// 游戏工具函数
const GameUtils = {
    // 格式化数字显示
    formatNumber: (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return Math.floor(num).toString();
    },
    
    // 计算两点之间的距离
    distance: (x1, y1, x2, y2) => {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },
    
    // 角度转弧度
    degToRad: (degrees) => {
        return degrees * (Math.PI / 180);
    },
    
    // 弧度转角度
    radToDeg: (radians) => {
        return radians * (180 / Math.PI);
    },
    
    // 限制数值在指定范围内
    clamp: (value, min, max) => {
        return Math.min(Math.max(value, min), max);
    },
    
    // 线性插值
    lerp: (start, end, factor) => {
        return start + (end - start) * factor;
    },
    
    // 随机整数
    randomInt: (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // 随机选择数组元素
    randomChoice: (array) => {
        return array[Math.floor(Math.random() * array.length)];
    },
    
    // 深拷贝对象
    deepCopy: (obj) => {
        return JSON.parse(JSON.stringify(obj));
    }
};

// 性能监控
const PerformanceMonitor = {
    frameCount: 0,
    lastTime: 0,
    fps: 0,
    
    update: () => {
        const now = performance.now();
        PerformanceMonitor.frameCount++;
        
        if (now - PerformanceMonitor.lastTime >= 1000) {
            PerformanceMonitor.fps = PerformanceMonitor.frameCount;
            PerformanceMonitor.frameCount = 0;
            PerformanceMonitor.lastTime = now;
            
            // 在调试模式下显示FPS
            if (window.DEBUG_MODE) {
                console.log(`FPS: ${PerformanceMonitor.fps}`);
            }
        }
    }
};

// 键盘快捷键
const KeyboardShortcuts = {
    init: () => {
        document.addEventListener('keydown', (e) => {
            // 防止在输入框中触发快捷键
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch(e.key) {
                case 'h':
                    KeyboardShortcuts.showHelp();
                    break;
                case 'p':
                    KeyboardShortcuts.togglePause();
                    break;
                case 'm':
                    KeyboardShortcuts.toggleMute();
                    break;
                case 'f':
                    KeyboardShortcuts.toggleFullscreen();
                    break;
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                    KeyboardShortcuts.selectCity(parseInt(e.key) - 1);
                    break;
            }
        });
    },
    
    showHelp: () => {
        const helpText = `
游戏快捷键:
WASD / 方向键 - 移动相机
空格 - 下一回合
ESC - 取消选择
H - 显示帮助
P - 暂停游戏
M - 静音
F - 全屏
1-5 - 选择城市
        `;
        alert(helpText);
    },
    
    togglePause: () => {
        if (window.game) {
            window.game.gameState = window.game.gameState === 'playing' ? 'paused' : 'playing';
            console.log('游戏', window.game.gameState === 'playing' ? '继续' : '暂停');
        }
    },
    
    toggleMute: () => {
        // 这里可以添加音效控制
        console.log('音效切换（功能待实现）');
    },
    
    toggleFullscreen: () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    },
    
    selectCity: (index) => {
        if (window.game) {
            const playerCities = window.game.cities.filter(city => city.owner === 0);
            if (playerCities[index]) {
                window.game.selectCity(playerCities[index]);
                
                // 移动相机到城市
                const pixel = window.game.map.hexToPixel(playerCities[index].q, playerCities[index].r);
                window.game.cameraX = window.game.canvas.width / 2 - pixel.x;
                window.game.cameraY = window.game.canvas.height / 2 - pixel.y;
            }
        }
    }
};

// 本地存储管理
const SaveManager = {
    save: (slotName = 'autosave') => {
        if (!window.game) return false;
        
        try {
            const saveData = {
                version: '1.0',
                timestamp: Date.now(),
                turn: window.game.turn,
                currentPlayer: window.game.currentPlayer,
                resources: window.game.resources,
                cities: window.game.cities.map(city => city.getInfo()),
                units: window.game.units.map(unit => unit.getInfo()),
                technology: {
                    researched: window.game.technology.researchedTechs.map(tech => tech.id),
                    current: window.game.technology.currentResearch?.id,
                    progress: window.game.technology.researchProgress
                }
            };
            
            localStorage.setItem(`civilization_save_${slotName}`, JSON.stringify(saveData));
            console.log(`游戏已保存到槽位: ${slotName}`);
            return true;
        } catch (error) {
            console.error('保存游戏失败:', error);
            return false;
        }
    },
    
    load: (slotName = 'autosave') => {
        try {
            const saveData = localStorage.getItem(`civilization_save_${slotName}`);
            if (!saveData) {
                console.log('没有找到存档');
                return false;
            }
            
            const data = JSON.parse(saveData);
            console.log('加载存档:', data);
            
            // 这里需要实现加载逻辑
            // 由于游戏结构复杂，暂时只显示信息
            alert(`找到存档: 回合 ${data.turn}, 保存时间: ${new Date(data.timestamp).toLocaleString()}`);
            
            return true;
        } catch (error) {
            console.error('加载游戏失败:', error);
            return false;
        }
    },
    
    getSaveList: () => {
        const saves = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('civilization_save_')) {
                const slotName = key.replace('civilization_save_', '');
                const data = JSON.parse(localStorage.getItem(key));
                saves.push({
                    slot: slotName,
                    turn: data.turn,
                    timestamp: data.timestamp
                });
            }
        }
        return saves.sort((a, b) => b.timestamp - a.timestamp);
    }
};

// 初始化快捷键
KeyboardShortcuts.init();

// 自动保存
setInterval(() => {
    if (window.game && window.game.gameState === 'playing') {
        SaveManager.save('autosave');
    }
}, 60000); // 每分钟自动保存

// 导出到全局作用域
window.GameUtils = GameUtils;
window.PerformanceMonitor = PerformanceMonitor;
window.SaveManager = SaveManager;

console.log('文明时代 - 游戏系统加载完成');
console.log('按 H 键查看快捷键帮助');
console.log('在URL后添加 #debug 启用调试模式');