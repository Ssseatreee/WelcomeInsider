import {
    isPersistentItem
} from '../data/items.js';

const SAVE_KEY = 'welcome-insider-save';

/** 每局关卡内重置的剧情标记（NPC 离场等） */
export const LEVEL_FLAG_KEYS = [
    'azeGone',
    'splyGone',
    'orenGone',
    'orenMet',
    'workClearedOnce',
    /** 本关内出卖奥伦：重试/失败不保留；通关后写入 campaignFlags */
    'orenBetrayed',
    /** 本关内斯普莉雅告密：重试/失败不保留；通关后写入 campaignFlags */
    'federicoAware'
];

/** 通关后保留、影响后续关卡的标记 */
export const CAMPAIGN_PROGRESS_FLAG_KEYS = [
    'orenBetrayed',
    'federicoAware'
];

/** 整局游戏保留的标记 */
export const CAMPAIGN_FLAG_KEYS = [
    ...CAMPAIGN_PROGRESS_FLAG_KEYS,
    'gameComplete'
];

const GameState = {

    currentLevel: 1,

    /** 跨关卡保留（如无人机） */
    persistentCollectedItems: [],

    /** 当前关卡内获得的物品 */
    levelCollectedItems: [],

    /** 已拾取的地图物体："{mapKey}:{objectId}"（按关卡重置） */
    pickedMapObjects: [],

    flags: {},

    /** 通关后累积的剧情进度（如第四关出卖奥伦、斯普莉雅告密） */
    campaignFlags: {},

    npcCatchCount: {},

    getMapObjectKey(mapKey, objectId)
    {
        return `${mapKey}:${objectId}`;
    },

    hasPickedMapObject(mapKey, objectId)
    {
        return this.pickedMapObjects.includes(
            this.getMapObjectKey(mapKey, objectId)
        );
    },

    markMapObjectPicked(mapKey, objectId)
    {
        const key =
            this.getMapObjectKey(mapKey, objectId);

        if (!this.pickedMapObjects.includes(key))
        {
            this.pickedMapObjects.push(key);
        }
    },

    getItemList(itemId)
    {
        return isPersistentItem(itemId)
            ? this.persistentCollectedItems
            : this.levelCollectedItems;
    },

    addCollectedItem(itemId)
    {
        const list = this.getItemList(itemId);

        if (!list.includes(itemId))
        {
            list.push(itemId);
        }
    },

    hasCollectedItem(itemId)
    {
        return (
            this.persistentCollectedItems.includes(itemId)
            ||
            this.levelCollectedItems.includes(itemId)
        );
    },

    removeCollectedItem(itemId)
    {
        const list = this.getItemList(itemId);

        const next =
            list.filter(id => id !== itemId);

        if (isPersistentItem(itemId))
        {
            this.persistentCollectedItems = next;
        }
        else
        {
            this.levelCollectedItems = next;
        }
    },

    /** 物品栏展示：跨关物品 + 本关物品 */
    getInventoryItemIds()
    {
        return [
            ...this.persistentCollectedItems,
            ...this.levelCollectedItems
        ];
    },

    hasDroneReveal()
    {
        return this.hasCollectedItem('drone');
    },

    /** 进入新关卡 / 重试本关时调用（保留无人机等跨关物品与整局标记） */
    resetLevelState()
    {
        this.resetLevelItems();

        for (const key of LEVEL_FLAG_KEYS)
        {
            delete this.flags[key];
        }

        this.npcCatchCount = {};
    },

    resetLevelItems()
    {
        this.levelCollectedItems = [];
        this.pickedMapObjects = [];
    },

    resetForNewGame()
    {
        this.currentLevel = 1;
        this.persistentCollectedItems = [];
        this.levelCollectedItems = [];
        this.pickedMapObjects = [];
        this.flags = {};
        this.campaignFlags = {};
        this.npcCatchCount = {};
    },

    /** 关卡通关时，将本关剧情结果写入跨关进度 */
    commitCampaignProgress()
    {
        for (const key of CAMPAIGN_PROGRESS_FLAG_KEYS)
        {
            if (this.flags[key])
            {
                this.campaignFlags[key] = true;
            }
        }
    },

    clearLevelFlags()
    {
        for (const key of LEVEL_FLAG_KEYS)
        {
            delete this.flags[key];
        }
    },

    peekSave()
    {
        try
        {
            const raw =
                localStorage.getItem(SAVE_KEY);

            if (!raw)
            {
                return null;
            }

            return JSON.parse(raw);
        }
        catch
        {
            return null;
        }
    },

    isValidSave(data)
    {
        return Boolean(
            data
            &&
            typeof data.level === 'number'
            &&
            data.currentMap
            &&
            Number.isFinite(Number(data.playerX))
            &&
            Number.isFinite(Number(data.playerY))
        );
    },

    hasSave()
    {
        return this.isValidSave(this.peekSave());
    },

    clearSave()
    {
        try
        {
            localStorage.removeItem(SAVE_KEY);
        }
        catch
        {
            // ignore
        }
    },

    saveProgress(snapshot)
    {
        const playerX = Number(snapshot.playerX);
        const playerY = Number(snapshot.playerY);

        const payload = {
            version: 2,
            level: snapshot.level ?? 1,
            currentLevel: this.currentLevel,
            currentMap: snapshot.currentMap || 'office',
            playerX:
                Number.isFinite(playerX)
                    ? playerX
                    : 0,
            playerY:
                Number.isFinite(playerY)
                    ? playerY
                    : 0,
            survivalMs: snapshot.survivalMs ?? 0,
            npcCatchCount:
                snapshot.npcCatchCount || {},
            npcs: snapshot.npcs || [],
            persistentCollectedItems: [
                ...this.persistentCollectedItems
            ],
            levelCollectedItems: [
                ...this.levelCollectedItems
            ],
            pickedMapObjects: [...this.pickedMapObjects],
            flags: { ...this.flags },
            campaignFlags: { ...this.campaignFlags }
        };

        try
        {
            localStorage.setItem(
                SAVE_KEY,
                JSON.stringify(payload)
            );

            return true;
        }
        catch
        {
            return false;
        }
    },

    loadSave()
    {
        const data = this.peekSave();

        if (!this.isValidSave(data))
        {
            return null;
        }

        this.applyFromSave(data);

        return data;
    },

    splitLegacyCollectedItems(collectedItems = [])
    {
        const persistent = [];
        const level = [];

        for (const itemId of collectedItems)
        {
            if (isPersistentItem(itemId))
            {
                if (!persistent.includes(itemId))
                {
                    persistent.push(itemId);
                }
            }
            else if (!level.includes(itemId))
            {
                level.push(itemId);
            }
        }

        return { persistent, level };
    },

    applyFromSave(data)
    {
        this.currentLevel =
            data.currentLevel ?? data.level ?? 1;

        if (
            Array.isArray(data.persistentCollectedItems)
            ||
            Array.isArray(data.levelCollectedItems)
        )
        {
            this.persistentCollectedItems = [
                ...(data.persistentCollectedItems || [])
            ];
            this.levelCollectedItems = [
                ...(data.levelCollectedItems || [])
            ];
        }
        else
        {
            const split =
                this.splitLegacyCollectedItems(
                    data.collectedItems || []
                );

            this.persistentCollectedItems = split.persistent;
            this.levelCollectedItems = split.level;
        }

        this.pickedMapObjects =
            [...(data.pickedMapObjects || [])];
        this.flags = { ...(data.flags || {}) };
        this.campaignFlags = {
            ...(data.campaignFlags || {})
        };

        if (!data.campaignFlags)
        {
            for (const key of CAMPAIGN_PROGRESS_FLAG_KEYS)
            {
                if (this.flags[key])
                {
                    this.campaignFlags[key] = true;
                }
            }
        }

        this.npcCatchCount =
            { ...(data.npcCatchCount || {}) };
    },

    buildSaveFromScene(scene)
    {
        const player = scene.player;
        let playerX = player?.x;
        let playerY = player?.y;

        if (!Number.isFinite(playerX))
        {
            playerX = player?.body?.position?.x ?? 0;
        }

        if (!Number.isFinite(playerY))
        {
            playerY = player?.body?.position?.y ?? 0;
        }

        return {
            level: scene.level,
            currentMap: scene.currentMap,
            playerX,
            playerY,
            survivalMs: scene.survivalMs,
            npcCatchCount: scene.npcCatchCount,
            npcs:
                scene.npcManager.getAllNPCs().map(
                    npc => ({
                        id: npc.id,
                        currentMap: npc.currentMap,
                        worldX: npc.worldX,
                        worldY: npc.worldY,
                        facing: npc.facing,
                        removed: npc.removed,
                        type: npc.type,
                        hasEmpathy: npc.hasEmpathy
                    })
                )
        };
    },

    increaseCatchCount(npcName)
    {
        if (!this.npcCatchCount[npcName]) {
            this.npcCatchCount[npcName] = 0;
        }
        this.npcCatchCount[npcName]++;
    },

    getCatchCount(npcName)
    {
        return this.npcCatchCount[npcName] || 0;
    },

    /** 费德里科是否处于共感追击（本关告密 或 第三关通关后永久） */
    isFedericoChasingPlayer()
    {
        return Boolean(
            this.flags.federicoAware
            ||
            this.campaignFlags.federicoAware
        );
    },

    /** 出卖奥伦是否已通关写入，仅下一关及以后作为追捕者 */
    isOrenBetrayedCommitted()
    {
        return Boolean(this.campaignFlags.orenBetrayed);
    },

    setFlag(key, value = true)
    {
        if (key === 'gameComplete')
        {
            this.campaignFlags.gameComplete = value;
            return;
        }

        this.flags[key] = value;
    },

    getFlag(key)
    {
        if (CAMPAIGN_PROGRESS_FLAG_KEYS.includes(key))
        {
            return Boolean(
                this.campaignFlags[key]
                ||
                this.flags[key]
            );
        }

        if (key === 'gameComplete')
        {
            return Boolean(this.campaignFlags.gameComplete);
        }

        return this.flags[key];
    }
};

export default GameState;
