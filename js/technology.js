// 科技系统
class Technology {
    constructor(id, name, cost, prerequisites = [], effects = {}) {
        this.id = id;
        this.name = name;
        this.cost = cost;
        this.prerequisites = prerequisites;
        this.effects = effects;
        this.researched = false;
        this.available = false;
    }

    // 检查是否可以研究
    canResearch(researchedTechs) {
        if (this.researched) return false;
        
        return this.prerequisites.every(prereq => 
            researchedTechs.some(tech => tech.id === prereq)
        );
    }
}

class TechnologyTree {
    constructor() {
        this.technologies = new Map();
        this.researchedTechs = [];
        this.currentResearch = null;
        this.researchProgress = 0;
        this.sciencePoints = 0;
        
        this.initializeTechnologies();
    }

    // 初始化科技树
    initializeTechnologies() {
        const techs = [
            // 古代科技
            new Technology('agriculture', '农业', 20, [], {
                description: '允许建造农场改良设施',
                unlocks: ['farm_improvement']
            }),
            
            new Technology('pottery', '陶器', 25, [], {
                description: '允许建造粮仓',
                unlocks: ['granary']
            }),
            
            new Technology('animal_husbandry', '畜牧业', 30, [], {
                description: '揭示马匹资源，允许建造牧场',
                unlocks: ['pasture_improvement', 'horses_resource']
            }),
            
            new Technology('mining', '采矿', 35, [], {
                description: '允许建造矿井改良设施',
                unlocks: ['mine_improvement']
            }),
            
            new Technology('sailing', '航海', 40, [], {
                description: '允许单位在海岸航行',
                unlocks: ['coastal_sailing']
            }),
            
            new Technology('archery', '射箭术', 25, [], {
                description: '解锁弓箭手单位',
                unlocks: ['archer_unit']
            }),
            
            new Technology('bronze_working', '青铜器', 35, ['mining'], {
                description: '解锁剑士单位和兵营建筑',
                unlocks: ['swordsman_unit', 'barracks']
            }),
            
            new Technology('wheel', '轮子', 45, ['animal_husbandry'], {
                description: '允许建造道路',
                unlocks: ['road_improvement']
            }),
            
            new Technology('writing', '文字', 50, ['pottery'], {
                description: '解锁图书馆建筑',
                unlocks: ['library']
            }),
            
            // 古典时代科技
            new Technology('iron_working', '铁器', 80, ['bronze_working'], {
                description: '揭示铁矿资源，解锁剑士单位',
                unlocks: ['iron_resource', 'improved_swordsman']
            }),
            
            new Technology('horseback_riding', '骑术', 85, ['wheel'], {
                description: '解锁骑兵单位',
                unlocks: ['horseman_unit']
            }),
            
            new Technology('currency', '货币', 90, ['bronze_working'], {
                description: '解锁市场建筑',
                unlocks: ['market']
            }),
            
            new Technology('construction', '建筑学', 100, ['bronze_working'], {
                description: '解锁城墙和水渠',
                unlocks: ['walls', 'aqueduct']
            }),
            
            new Technology('mathematics', '数学', 110, ['writing'], {
                description: '解锁投石机和法院',
                unlocks: ['catapult_unit', 'courthouse']
            }),
            
            new Technology('philosophy', '哲学', 120, ['writing'], {
                description: '解锁神庙和大图书馆',
                unlocks: ['temple', 'great_library']
            }),
            
            // 中世纪科技
            new Technology('engineering', '工程学', 150, ['mathematics', 'construction'], {
                description: '解锁弩兵和城堡',
                unlocks: ['crossbow_unit', 'castle']
            }),
            
            new Technology('machinery', '机械', 160, ['engineering'], {
                description: '解锁风车和改进的弩兵',
                unlocks: ['windmill', 'improved_crossbow']
            }),
            
            new Technology('optics', '光学', 140, ['mathematics'], {
                description: '解锁灯塔和天文台',
                unlocks: ['lighthouse', 'observatory']
            }),
            
            new Technology('steel', '钢铁', 180, ['iron_working'], {
                description: '解锁长剑士和改进的武器',
                unlocks: ['longswordsman_unit', 'improved_weapons']
            })
        ];

        techs.forEach(tech => {
            this.technologies.set(tech.id, tech);
        });

        // 更新可用科技
        this.updateAvailableTechs();
    }

    // 更新可用科技
    updateAvailableTechs() {
        this.technologies.forEach(tech => {
            tech.available = tech.canResearch(this.researchedTechs);
        });
    }

    // 开始研究科技
    startResearch(techId) {
        const tech = this.technologies.get(techId);
        if (!tech || !tech.available || tech.researched) {
            return false;
        }

        this.currentResearch = tech;
        this.researchProgress = 0;
        return true;
    }

    // 添加科学点数
    addScience(points) {
        this.sciencePoints += points;
        
        if (this.currentResearch) {
            this.researchProgress += points;
            
            if (this.researchProgress >= this.currentResearch.cost) {
                this.completeResearch();
            }
        }
    }

    // 完成科技研究
    completeResearch() {
        if (!this.currentResearch) return;

        const tech = this.currentResearch;
        tech.researched = true;
        this.researchedTechs.push(tech);
        
        // 应用科技效果
        this.applyTechEffects(tech);
        
        // 添加游戏消息
        if (window.game) {
            window.game.addMessage(`研究完成：${tech.name}！`);
        }

        // 重置研究状态
        this.currentResearch = null;
        this.researchProgress = 0;
        
        // 更新可用科技
        this.updateAvailableTechs();
    }

    // 应用科技效果
    applyTechEffects(tech) {
        const game = window.game;
        if (!game) return;

        // 解锁新单位
        if (tech.effects.unlocks) {
            tech.effects.unlocks.forEach(unlock => {
                if (unlock.endsWith('_unit')) {
                    // 解锁单位类型
                    game.unlockedUnits = game.unlockedUnits || [];
                    const unitType = unlock.replace('_unit', '');
                    if (!game.unlockedUnits.includes(unitType)) {
                        game.unlockedUnits.push(unitType);
                    }
                } else if (unlock.endsWith('_improvement')) {
                    // 解锁地块改良
                    game.unlockedImprovements = game.unlockedImprovements || [];
                    const improvementType = unlock.replace('_improvement', '');
                    if (!game.unlockedImprovements.includes(improvementType)) {
                        game.unlockedImprovements.push(improvementType);
                    }
                } else {
                    // 解锁建筑
                    game.unlockedBuildings = game.unlockedBuildings || [];
                    if (!game.unlockedBuildings.includes(unlock)) {
                        game.unlockedBuildings.push(unlock);
                    }
                }
            });
        }
    }

    // 获取可研究的科技
    getAvailableTechs() {
        return Array.from(this.technologies.values()).filter(tech => tech.available);
    }

    // 获取已研究的科技
    getResearchedTechs() {
        return this.researchedTechs;
    }

    // 获取科技信息
    getTechInfo(techId) {
        return this.technologies.get(techId);
    }

    // 检查是否已研究某科技
    hasResearched(techId) {
        return this.researchedTechs.some(tech => tech.id === techId);
    }

    // 获取研究进度百分比
    getResearchProgress() {
        if (!this.currentResearch) return 0;
        return Math.min(this.researchProgress / this.currentResearch.cost, 1);
    }

    // 获取当前研究信息
    getCurrentResearchInfo() {
        if (!this.currentResearch) return null;
        
        return {
            tech: this.currentResearch,
            progress: this.researchProgress,
            cost: this.currentResearch.cost,
            percentage: this.getResearchProgress() * 100,
            turnsRemaining: this.estimateTurnsRemaining()
        };
    }

    // 估算剩余回合数
    estimateTurnsRemaining() {
        if (!this.currentResearch) return 0;
        
        const game = window.game;
        if (!game) return 0;
        
        const sciencePerTurn = game.getSciencePerTurn();
        if (sciencePerTurn <= 0) return Infinity;
        
        const remainingCost = this.currentResearch.cost - this.researchProgress;
        return Math.ceil(remainingCost / sciencePerTurn);
    }

    // 获取科技树状态
    getTreeState() {
        const state = {
            available: [],
            researched: [],
            current: this.getCurrentResearchInfo()
        };

        this.technologies.forEach(tech => {
            if (tech.researched) {
                state.researched.push(tech);
            } else if (tech.available) {
                state.available.push(tech);
            }
        });

        return state;
    }

    // 重置科技树（新游戏）
    reset() {
        this.researchedTechs = [];
        this.currentResearch = null;
        this.researchProgress = 0;
        this.sciencePoints = 0;
        
        this.technologies.forEach(tech => {
            tech.researched = false;
            tech.available = false;
        });
        
        this.updateAvailableTechs();
    }

    // 获取科技依赖关系
    getTechDependencies(techId) {
        const tech = this.technologies.get(techId);
        if (!tech) return [];
        
        const dependencies = [];
        const visited = new Set();
        
        const collectDeps = (id) => {
            if (visited.has(id)) return;
            visited.add(id);
            
            const t = this.technologies.get(id);
            if (t) {
                t.prerequisites.forEach(prereq => {
                    dependencies.push(prereq);
                    collectDeps(prereq);
                });
            }
        };
        
        collectDeps(techId);
        return dependencies;
    }

    // 获取科技解锁的内容
    getTechUnlocks(techId) {
        const tech = this.technologies.get(techId);
        if (!tech || !tech.effects.unlocks) return [];
        
        return tech.effects.unlocks.map(unlock => {
            if (unlock.endsWith('_unit')) {
                return { type: 'unit', name: this.getUnitName(unlock.replace('_unit', '')) };
            } else if (unlock.endsWith('_improvement')) {
                return { type: 'improvement', name: this.getImprovementName(unlock.replace('_improvement', '')) };
            } else {
                return { type: 'building', name: this.getBuildingName(unlock) };
            }
        });
    }

    // 获取单位名称
    getUnitName(unitType) {
        const names = {
            archer: '弓箭手',
            swordsman: '剑士',
            horseman: '骑兵',
            catapult: '投石机',
            crossbow: '弩兵',
            longswordsman: '长剑士'
        };
        return names[unitType] || unitType;
    }

    // 获取改良设施名称
    getImprovementName(improvementType) {
        const names = {
            farm: '农场',
            mine: '矿井',
            pasture: '牧场',
            road: '道路'
        };
        return names[improvementType] || improvementType;
    }

    // 获取建筑名称
    getBuildingName(buildingType) {
        const names = {
            granary: '粮仓',
            barracks: '兵营',
            library: '图书馆',
            market: '市场',
            walls: '城墙',
            temple: '神庙',
            courthouse: '法院',
            castle: '城堡',
            lighthouse: '灯塔',
            observatory: '天文台',
            windmill: '风车',
            aqueduct: '水渠'
        };
        return names[buildingType] || buildingType;
    }
}