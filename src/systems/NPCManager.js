export default class NPCManager {
    constructor(game) {
        this.game = game;

        // 全局NPC数据（永不销毁）
        this.npcs = new Map();
    }

    register(npc) {
        this.npcs.set(npc.id, npc);
    }

    update(player, delta) {
        for (const npc of this.npcs.values()) {
            npc.updateAI(player, delta);
        }
    }

    getVisibleNPCs(currentMapKey) {
        return [...this.npcs.values()].filter(npc =>
            npc.currentMap === currentMapKey
        );
    }
}