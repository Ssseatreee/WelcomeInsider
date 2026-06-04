import portalData from '../data/portalData.js';

/** NPC 不可进入的地图 */
const BLOCKED_NPC_MAPS = new Set([
    'toilet'
]);

export default class PortalRegistry
{
    constructor()
    {
        this.data = portalData;
        this._adjacency = this._buildAdjacency();
    }

    _buildAdjacency()
    {
        const adj = {};

        for (const mapKey of Object.keys(this.data))
        {
            adj[mapKey] = new Set();

            for (const portal of Object.values(this.data[mapKey]))
            {
                adj[mapKey].add(portal.targetMap);
            }
        }

        return adj;
    }

    getCenter(portal)
    {
        return {
            x: portal.x + portal.width / 2,
            y: portal.y + portal.height / 2
        };
    }

    getPortalsOnMap(mapKey)
    {
        const map = this.data[mapKey];

        if (!map)
        {
            return [];
        }

        return Object.entries(map).map(
            ([name, portal]) => ({ name, ...portal })
        );
    }

    isBlockedMapForNpc(mapKey)
    {
        return BLOCKED_NPC_MAPS.has(mapKey);
    }

    getNpcPortalsOnMap(mapKey)
    {
        return this.getPortalsOnMap(mapKey).filter(
            portal =>
                !this.isBlockedMapForNpc(portal.targetMap)
        );
    }

    findMapPath(fromMap, toMap)
    {
        if (this.isBlockedMapForNpc(toMap))
        {
            return null;
        }

        if (fromMap === toMap)
        {
            return [fromMap];
        }

        const queue = [[fromMap]];
        const visited = new Set([fromMap]);

        while (queue.length > 0)
        {
            const path = queue.shift();
            const current = path[path.length - 1];

            for (const neighbor of this._adjacency[current] || [])
            {
                if (this.isBlockedMapForNpc(neighbor))
                {
                    continue;
                }

                if (neighbor === toMap)
                {
                    return [...path, neighbor];
                }

                if (!visited.has(neighbor))
                {
                    visited.add(neighbor);
                    queue.push([...path, neighbor]);
                }
            }
        }

        return null;
    }

    getNextPortal(mapKey, targetMapKey, x, y)
    {
        const path = this.findMapPath(mapKey, targetMapKey);

        if (!path || path.length < 2)
        {
            return null;
        }

        const nextMap = path[1];
        const candidates =
            this.getPortalsOnMap(mapKey).filter(
                portal => portal.targetMap === nextMap
            );

        if (candidates.length === 0)
        {
            return null;
        }

        let best = candidates[0];
        let bestDist = Infinity;

        for (const portal of candidates)
        {
            const center = this.getCenter(portal);
            const dist =
                Math.hypot(center.x - x, center.y - y);

            if (dist < bestDist)
            {
                bestDist = dist;
                best = portal;
            }
        }

        return best;
    }

    containsPoint(portal, x, y)
    {
        return (
            x >= portal.x
            && x <= portal.x + portal.width
            && y >= portal.y
            && y <= portal.y + portal.height
        );
    }

    tryPortalTransition(entity)
    {
        const portals =
            this.getPortalsOnMap(entity.currentMap);

        for (const portal of portals)
        {
            if (!this.containsPoint(portal, entity.worldX, entity.worldY))
            {
                continue;
            }

            if (this.isBlockedMapForNpc(portal.targetMap))
            {
                continue;
            }

            const target =
                this.data[portal.targetMap]?.[portal.targetPortal];

            if (!target)
            {
                continue;
            }

            const center = this.getCenter(target);

            entity.currentMap = portal.targetMap;
            entity.worldX = center.x;
            entity.worldY = center.y;
            entity.vx = 0;
            entity.vy = 0;

            if (entity.pathing)
            {
                entity.pathing.reset();
            }

            return true;
        }

        return false;
    }
}
