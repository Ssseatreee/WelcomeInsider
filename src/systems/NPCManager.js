import HunterPathing from './HunterPathing.js';
import NavigationGrid from './NavigationGrid.js';

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

    clear()
    {
        this.npcs.clear();
    }

    update(context, delta)
    {
        for (const npc of this.npcs.values())
        {
            if (npc.removed)
            {
                continue;
            }

            const offScene =
                npc.currentMap !== context.sceneMap;

            if (offScene)
            {
                if (
                    !NavigationGrid.get(npc.currentMap)
                    &&
                    context.ensureNavGrid
                )
                {
                    context.ensureNavGrid(npc.currentMap);
                }
            }

            npc.update(
                context,
                delta
            );

            if (
                offScene
                &&
                (
                    npc.type === 'neutral'
                    ||
                    (
                        npc.type === 'hunter'
                        &&
                        !npc.hasEmpathy
                    )
                )
            )
            {
                HunterPathing.clampEntity(
                    npc,
                    npc.currentMap
                );
            }
        }
    }

    clampNPCsOnMap(mapKey)
    {
        for (const npc of this.npcs.values())
        {
            if (
                npc.removed
                ||
                npc.currentMap !== mapKey
            )
            {
                continue;
            }

            HunterPathing.clampEntity(
                npc,
                mapKey
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