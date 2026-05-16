const GameState = {

    currentLevel: 1,

    collectedItems: [],

    flags: {},

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