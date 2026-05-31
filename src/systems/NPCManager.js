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

    update(context, delta)
    {
        for (const npc of this.npcs.values())
        {
            if (npc.removed)
            {
                continue;
            }

            npc.update(
                context,
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

    getNPC(id)
    {
        return this.npcs.get(id);
    }

    getAllNPCs()
    {
        return [...this.npcs.values()];
    }
}