# 文明时代 - Civilization Era

一个基于网页的类似文明6的策略游戏，使用HTML5 Canvas和JavaScript构建。

## 游戏特色

### 🗺️ 六边形地图系统
- 基于六边形网格的地图，类似文明6
- 多样化的地形类型：草原、平原、森林、丘陵、山脉、水域
- 程序化生成的地形和资源
- 河流系统增加地块产出
- 战争迷雾和探索机制

### 🏛️ 城市建设
- 建立和管理城市
- 人口增长系统
- 建筑建造（粮仓、兵营、图书馆等）
- 地块工作分配
- 生产队列管理

### ⚔️ 单位系统
- 多种单位类型：开拓者、战士、工人、侦察兵、弓箭手
- 单位移动和战斗
- 经验值和升级系统
- 自动探索周围区域

### 🔬 科技树
- 完整的科技研究系统
- 科技解锁新单位、建筑和改良设施
- 从古代到中世纪的科技进程
- 科技依赖关系

### 🌾 资源和改良
- 多种战略资源：小麦、铁矿、金矿、马匹等
- 地块改良设施：农场、矿井、牧场、道路
- 资源提供产出加成

### 🎮 游戏机制
- 回合制游戏循环
- 多玩家支持（玩家 vs AI）
- 资源管理（食物、生产力、金币、科学、文化）
- 自动保存功能

## 游戏控制

### 鼠标操作
- **左键点击** - 选择单位/城市，移动单位
- **鼠标滚轮** - 缩放地图
- **鼠标移动** - 查看地块信息

### 键盘快捷键
- **WASD / 方向键** - 移动相机
- **空格键** - 下一回合
- **ESC** - 取消选择
- **H** - 显示帮助
- **P** - 暂停游戏
- **F** - 全屏模式
- **1-5** - 快速选择城市

### UI界面
- **顶部栏** - 显示回合数、资源、下一回合按钮
- **左侧面板** - 科技树和城市列表
- **右侧面板** - 单位信息、地块详情、建造选项
- **底部状态栏** - 游戏消息和提示

## 技术特性

### 前端技术
- **HTML5 Canvas** - 游戏渲染
- **JavaScript ES6+** - 游戏逻辑
- **CSS3** - 界面样式
- **模块化设计** - 易于扩展和维护

### 游戏系统
- **六边形坐标系统** - 立方体坐标转换
- **Simplex噪声** - 程序化地形生成
- **状态管理** - 游戏状态持久化
- **事件驱动** - 响应式用户交互

### 性能优化
- **视锥剔除** - 只渲染可见区域
- **对象池** - 减少内存分配
- **帧率监控** - 性能调试工具

## 文件结构

```
/workspace/
├── index.html          # 主HTML文件
├── styles.css          # 样式表
├── js/
│   ├── main.js         # 主入口文件
│   ├── game.js         # 游戏主类
│   ├── hexagon.js      # 六边形地图系统
│   ├── units.js        # 单位系统
│   ├── cities.js       # 城市系统
│   ├── technology.js   # 科技树系统
│   └── terrain.js      # 地形生成系统
└── README.md           # 说明文档
```

## 启动游戏

1. 启动HTTP服务器：
```bash
python3 -m http.server 12000 --bind 0.0.0.0
```

2. 在浏览器中访问：
```
http://localhost:12000
```

3. 启用调试模式（可选）：
```
http://localhost:12000/#debug
```

## 调试功能

在调试模式下，可以使用以下控制台命令：

```javascript
// 添加资源
debugCommands.addGold(1000)
debugCommands.addScience(500)

// 创建单位
debugCommands.createUnit('warrior', 0, 0)

// 揭示地图
debugCommands.revealMap()

// 跳过回合
debugCommands.nextTurn(5)

// 显示帮助
debugCommands.help()
```

## 游戏目标

### 短期目标
- 建立第一个城市
- 探索周围区域
- 研究基础科技
- 训练军事单位

### 长期目标
- 扩张领土
- 发展科技
- 建设强大的文明
- 征服其他文明

## 开发计划

### 已实现功能 ✅
- 六边形地图系统
- 基础单位和城市
- 科技树
- 回合制游戏循环
- 资源管理
- 地形生成

### 计划功能 🚧
- 外交系统
- 贸易路线
- 宗教系统
- 文化胜利
- 更多单位类型
- 多人在线模式

### 可能的改进 💡
- 音效和音乐
- 动画效果
- 更好的AI
- 地图编辑器
- 模组支持
- 移动端适配

## 贡献指南

欢迎提交问题报告和功能建议！

### 开发环境
- 现代浏览器（Chrome、Firefox、Safari、Edge）
- 文本编辑器或IDE
- 基础的HTML/CSS/JavaScript知识

### 代码规范
- 使用ES6+语法
- 模块化设计
- 注释清晰
- 变量命名有意义

## 许可证

本项目采用MIT许可证，详见LICENSE文件。

## 致谢

- 灵感来源：Sid Meier's Civilization VI
- 六边形网格算法：Red Blob Games
- 噪声生成：Simplex Noise

---

**享受你的文明征程！** 🏛️⚔️🌍