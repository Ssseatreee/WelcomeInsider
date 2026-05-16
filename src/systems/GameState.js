const GameState = {

    currentLevel: 1,

    collectedItems: [],

    flags: {},

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