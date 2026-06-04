const SAVE_KEY = 'welcome-insider-save';

const GameState = {

    currentLevel: 1,

    collectedItems: [],

    /** 已拾取的地图物体："{mapKey}:{objectId}" */
    pickedMapObjects: [],

    flags: {},

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

    addCollectedItem(itemId)
    {
        if (!this.collectedItems.includes(itemId))
        {
            this.collectedItems.push(itemId);
        }
    },

    hasCollectedItem(itemId)
    {
        return this.collectedItems.includes(itemId);
    },

    removeCollectedItem(itemId)
    {
        this.collectedItems =
            this.collectedItems.filter(
                id => id !== itemId
            );
    },

    hasDroneReveal()
    {
        return this.hasCollectedItem('drone');
    },

    resetForNewGame()
    {
        this.currentLevel = 1;
        this.collectedItems = [];
        this.pickedMapObjects = [];
        this.flags = {};
        this.npcCatchCount = {};
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
            version: 1,
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
            collectedItems: [...this.collectedItems],
            pickedMapObjects: [...this.pickedMapObjects],
            flags: { ...this.flags }
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

    applyFromSave(data)
    {
        this.currentLevel =
            data.currentLevel ?? data.level ?? 1;
        this.collectedItems =
            [...(data.collectedItems || [])];
        this.pickedMapObjects =
            [...(data.pickedMapObjects || [])];
        this.flags = { ...(data.flags || {}) };
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

    setFlag(key, value = true)
    {
        this.flags[key] = value;
    },

    getFlag(key)
    {
        return this.flags[key];
    }
};

export default GameState;