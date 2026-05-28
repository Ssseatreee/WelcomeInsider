export default class NPCManager
{
    constructor()
    {
        this.npcs = new Map();
    }

    register(npc)
    {
        this.npcs.set(
            npc.id,
            npc
        );
    }

    update(player, delta)
    {
        for (const npc of this.npcs.values())
        {
            npc.update(
                player,
                delta
            );
        }
    }

    getNPCsInMap(mapKey)
    {
        return [...this.npcs.values()]
            .filter(
                npc =>
                    npc.currentMap === mapKey
            );
    }
}