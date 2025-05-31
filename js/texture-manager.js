// 纹理管理系统
class TextureManager {
    constructor() {
        this.textures = new Map();
        this.loadingPromises = new Map();
        this.isLoaded = false;
        this.loadProgress = 0;
        this.totalTextures = 0;
        this.loadedTextures = 0;
    }

    // 初始化并加载所有纹理
    async initialize() {
        console.log('开始加载地形纹理...');
        
        // 定义所有需要加载的纹理
        const textureDefinitions = {
            // 基础地形纹理
            grassland: this.createGrasslandTexture(),
            plains: this.createPlainsTexture(),
            forest: this.createForestTexture(),
            hills: this.createHillsTexture(),
            mountains: this.createMountainsTexture(),
            water: this.createWaterTexture(),
            desert: this.createDesertTexture(),
            tundra: this.createTundraTexture(),
            snow: this.createSnowTexture(),
            
            // 资源纹理
            wheat: this.createResourceTexture('#f1c40f', '🌾'),
            iron: this.createResourceTexture('#95a5a6', '⚒️'),
            gold: this.createResourceTexture('#f39c12', '💰'),
            stone: this.createResourceTexture('#7f8c8d', '🗿'),
            horses: this.createResourceTexture('#8b4513', '🐎'),
            deer: this.createResourceTexture('#d2691e', '🦌'),
            fish: this.createResourceTexture('#3498db', '🐟'),
            
            // 特殊纹理
            river: this.createRiverTexture(),
            road: this.createRoadTexture(),
            fog: this.createFogTexture()
        };

        this.totalTextures = Object.keys(textureDefinitions).length;
        
        // 加载所有纹理
        const loadPromises = Object.entries(textureDefinitions).map(([name, textureData]) => {
            return this.loadTexture(name, textureData);
        });

        try {
            await Promise.all(loadPromises);
            this.isLoaded = true;
            console.log('所有纹理加载完成！');
            return true;
        } catch (error) {
            console.error('纹理加载失败:', error);
            return false;
        }
    }

    // 加载单个纹理
    async loadTexture(name, textureData) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = textureData.width || 64;
            canvas.height = textureData.height || 64;
            
            // 绘制纹理
            textureData.draw(ctx, canvas.width, canvas.height);
            
            // 创建图像对象
            const img = new Image();
            img.onload = () => {
                this.textures.set(name, {
                    image: img,
                    canvas: canvas,
                    width: canvas.width,
                    height: canvas.height
                });
                
                this.loadedTextures++;
                this.loadProgress = this.loadedTextures / this.totalTextures;
                
                console.log(`纹理 ${name} 加载完成 (${this.loadedTextures}/${this.totalTextures})`);
                resolve();
            };
            
            img.onerror = () => {
                console.error(`纹理 ${name} 加载失败`);
                reject(new Error(`Failed to load texture: ${name}`));
            };
            
            img.src = canvas.toDataURL();
        });
    }

    // 获取纹理
    getTexture(name) {
        return this.textures.get(name);
    }

    // 检查纹理是否存在
    hasTexture(name) {
        return this.textures.has(name);
    }

    // 创建草地纹理
    createGrasslandTexture() {
        return {
            width: 64,
            height: 64,
            draw: (ctx, width, height) => {
                // 基础绿色背景
                const gradient = ctx.createLinearGradient(0, 0, width, height);
                gradient.addColorStop(0, '#2ecc71');
                gradient.addColorStop(0.5, '#27ae60');
                gradient.addColorStop(1, '#229954');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
                
                // 添加草地纹理细节
                ctx.fillStyle = '#1e8449';
                for (let i = 0; i < 20; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const size = Math.random() * 3 + 1;
                    ctx.fillRect(x, y, size, size);
                }
                
                // 添加更亮的高光
                ctx.fillStyle = '#58d68d';
                for (let i = 0; i < 15; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const size = Math.random() * 2 + 1;
                    ctx.fillRect(x, y, size, size);
                }
            }
        };
    }

    // 创建平原纹理
    createPlainsTexture() {
        return {
            width: 64,
            height: 64,
            draw: (ctx, width, height) => {
                // 基础黄绿色背景
                const gradient = ctx.createLinearGradient(0, 0, width, height);
                gradient.addColorStop(0, '#f1c40f');
                gradient.addColorStop(0.5, '#f39c12');
                gradient.addColorStop(1, '#e67e22');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
                
                // 添加干草纹理
                ctx.fillStyle = '#d68910';
                for (let i = 0; i < 25; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const size = Math.random() * 2 + 1;
                    ctx.fillRect(x, y, size, size);
                }
            }
        };
    }

    // 创建森林纹理
    createForestTexture() {
        return {
            width: 64,
            height: 64,
            draw: (ctx, width, height) => {
                // 深绿色背景
                const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
                gradient.addColorStop(0, '#1e8449');
                gradient.addColorStop(1, '#0d4f2a');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
                
                // 绘制树木形状
                ctx.fillStyle = '#0a3d1f';
                for (let i = 0; i < 8; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const radius = Math.random() * 8 + 4;
                    
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // 添加亮点
                ctx.fillStyle = '#27ae60';
                for (let i = 0; i < 12; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const size = Math.random() * 3 + 1;
                    ctx.fillRect(x, y, size, size);
                }
            }
        };
    }

    // 创建丘陵纹理
    createHillsTexture() {
        return {
            width: 64,
            height: 64,
            draw: (ctx, width, height) => {
                // 棕色基础
                const gradient = ctx.createLinearGradient(0, 0, width, height);
                gradient.addColorStop(0, '#8b4513');
                gradient.addColorStop(0.5, '#a0522d');
                gradient.addColorStop(1, '#654321');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
                
                // 添加岩石纹理
                ctx.fillStyle = '#5d4037';
                for (let i = 0; i < 15; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const w = Math.random() * 6 + 2;
                    const h = Math.random() * 6 + 2;
                    ctx.fillRect(x, y, w, h);
                }
                
                // 添加高光
                ctx.fillStyle = '#bcaaa4';
                for (let i = 0; i < 10; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const size = Math.random() * 2 + 1;
                    ctx.fillRect(x, y, size, size);
                }
            }
        };
    }

    // 创建山脉纹理
    createMountainsTexture() {
        return {
            width: 64,
            height: 64,
            draw: (ctx, width, height) => {
                // 灰色基础
                const gradient = ctx.createLinearGradient(0, 0, width, height);
                gradient.addColorStop(0, '#95a5a6');
                gradient.addColorStop(0.5, '#7f8c8d');
                gradient.addColorStop(1, '#566573');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
                
                // 绘制山峰轮廓
                ctx.fillStyle = '#34495e';
                ctx.beginPath();
                ctx.moveTo(0, height);
                ctx.lineTo(width * 0.3, height * 0.2);
                ctx.lineTo(width * 0.7, height * 0.4);
                ctx.lineTo(width, height * 0.1);
                ctx.lineTo(width, height);
                ctx.closePath();
                ctx.fill();
                
                // 添加雪峰
                ctx.fillStyle = '#ecf0f1';
                ctx.beginPath();
                ctx.moveTo(width * 0.25, height * 0.3);
                ctx.lineTo(width * 0.35, height * 0.2);
                ctx.lineTo(width * 0.45, height * 0.3);
                ctx.closePath();
                ctx.fill();
            }
        };
    }

    // 创建水域纹理
    createWaterTexture() {
        return {
            width: 64,
            height: 64,
            draw: (ctx, width, height) => {
                // 蓝色基础
                const gradient = ctx.createLinearGradient(0, 0, width, height);
                gradient.addColorStop(0, '#3498db');
                gradient.addColorStop(0.5, '#2980b9');
                gradient.addColorStop(1, '#1f4e79');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
                
                // 添加波浪效果
                ctx.strokeStyle = '#5dade2';
                ctx.lineWidth = 2;
                for (let i = 0; i < 5; i++) {
                    ctx.beginPath();
                    const y = (height / 6) * (i + 1);
                    ctx.moveTo(0, y);
                    
                    for (let x = 0; x <= width; x += 8) {
                        const waveY = y + Math.sin((x / width) * Math.PI * 2) * 3;
                        ctx.lineTo(x, waveY);
                    }
                    ctx.stroke();
                }
            }
        };
    }

    // 创建沙漠纹理
    createDesertTexture() {
        return {
            width: 64,
            height: 64,
            draw: (ctx, width, height) => {
                // 沙色基础
                const gradient = ctx.createLinearGradient(0, 0, width, height);
                gradient.addColorStop(0, '#f4d03f');
                gradient.addColorStop(0.5, '#f1c40f');
                gradient.addColorStop(1, '#d4ac0d');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
                
                // 添加沙丘纹理
                ctx.fillStyle = '#d68910';
                for (let i = 0; i < 30; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const size = Math.random() * 2 + 1;
                    ctx.fillRect(x, y, size, size);
                }
            }
        };
    }

    // 创建苔原纹理
    createTundraTexture() {
        return {
            width: 64,
            height: 64,
            draw: (ctx, width, height) => {
                // 灰绿色基础
                const gradient = ctx.createLinearGradient(0, 0, width, height);
                gradient.addColorStop(0, '#85929e');
                gradient.addColorStop(0.5, '#5d6d7e');
                gradient.addColorStop(1, '#34495e');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
                
                // 添加苔藓斑点
                ctx.fillStyle = '#58d68d';
                for (let i = 0; i < 15; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const radius = Math.random() * 4 + 2;
                    
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        };
    }

    // 创建雪地纹理
    createSnowTexture() {
        return {
            width: 64,
            height: 64,
            draw: (ctx, width, height) => {
                // 白色基础
                const gradient = ctx.createLinearGradient(0, 0, width, height);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.5, '#f8f9fa');
                gradient.addColorStop(1, '#e9ecef');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
                
                // 添加雪花
                ctx.fillStyle = '#dee2e6';
                for (let i = 0; i < 20; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const size = Math.random() * 3 + 1;
                    ctx.fillRect(x, y, size, size);
                }
            }
        };
    }

    // 创建资源纹理
    createResourceTexture(color, emoji) {
        return {
            width: 32,
            height: 32,
            draw: (ctx, width, height) => {
                // 背景圆圈
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(width/2, height/2, width/2 - 2, 0, Math.PI * 2);
                ctx.fill();
                
                // 边框
                ctx.strokeStyle = '#2c3e50';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // 绘制emoji图标
                ctx.fillStyle = '#2c3e50';
                ctx.font = `${width * 0.6}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(emoji, width/2, height/2);
            }
        };
    }

    // 创建河流纹理
    createRiverTexture() {
        return {
            width: 64,
            height: 8,
            draw: (ctx, width, height) => {
                // 蓝色河流
                const gradient = ctx.createLinearGradient(0, 0, 0, height);
                gradient.addColorStop(0, '#3498db');
                gradient.addColorStop(0.5, '#2980b9');
                gradient.addColorStop(1, '#3498db');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
                
                // 添加波光
                ctx.fillStyle = '#85c1e9';
                for (let i = 0; i < 8; i++) {
                    const x = (width / 8) * i;
                    const y = height / 2;
                    ctx.fillRect(x, y, 2, 1);
                }
            }
        };
    }

    // 创建道路纹理
    createRoadTexture() {
        return {
            width: 64,
            height: 8,
            draw: (ctx, width, height) => {
                // 灰色道路
                ctx.fillStyle = '#7f8c8d';
                ctx.fillRect(0, 0, width, height);
                
                // 道路边缘
                ctx.fillStyle = '#566573';
                ctx.fillRect(0, 0, width, 1);
                ctx.fillRect(0, height-1, width, 1);
                
                // 中央虚线
                ctx.fillStyle = '#bdc3c7';
                for (let i = 0; i < width; i += 8) {
                    ctx.fillRect(i, height/2, 4, 1);
                }
            }
        };
    }

    // 创建迷雾纹理
    createFogTexture() {
        return {
            width: 64,
            height: 64,
            draw: (ctx, width, height) => {
                // 半透明黑色
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.fillRect(0, 0, width, height);
                
                // 添加迷雾效果
                const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
                gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
            }
        };
    }

    // 在六边形内绘制纹理
    drawTextureInHex(ctx, textureName, centerX, centerY, hexSize) {
        const texture = this.getTexture(textureName);
        if (!texture) {
            console.warn(`纹理 ${textureName} 不存在`);
            return false;
        }

        ctx.save();
        
        // 创建六边形裁剪路径
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = centerX + hexSize * Math.cos(angle);
            const y = centerY + hexSize * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.clip();
        
        // 绘制纹理
        const textureSize = hexSize * 1.8; // 稍微大一点以确保覆盖整个六边形
        ctx.drawImage(
            texture.image,
            centerX - textureSize/2,
            centerY - textureSize/2,
            textureSize,
            textureSize
        );
        
        ctx.restore();
        return true;
    }

    // 获取加载进度
    getLoadProgress() {
        return {
            loaded: this.loadedTextures,
            total: this.totalTextures,
            progress: this.loadProgress,
            isComplete: this.isLoaded
        };
    }
}

// 导出到全局作用域
window.TextureManager = TextureManager;