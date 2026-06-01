const GameState = {

    currentLevel: 1,

    collectedItems: [],

    /** 已拾取的地图物体："{mapKey}:{objectId}" */
    pickedMapObjects: [],

    flags: {},

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

    // npcCatchCount: {},

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