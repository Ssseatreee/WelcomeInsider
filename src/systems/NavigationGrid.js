const gridCache = new Map();

/** 与 NPCSprite Matter 碰撞体半径对齐（24×24  body） */
export const NPC_BODY_MARGIN = 12;

/** 明确的地形层（有 tile 才可站立） */
const GROUND_LAYER_NAMES = [
    'floor',
    'ground',
    'ground2',
    'ground2.1',
    'ground2.2'
];

/** 不参与“可站立”判定的装饰 / 碰撞层 */
const NON_GROUND_LAYER_NAMES = new Set([
    'border',
    'border1',
    'objects',
    'wall',
    'door',
    'blanket',
    'laterano',
    'sculpture',
    'chairs',
    'zhuzi',
    'taizi',
    'taizi-chairs',
    'taizi2',
    'top',
    'top2'
]);

export default class NavigationGrid
{
    constructor(map, layers, tileWidth, tileHeight)
    {
        this.mapKey = map.key;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.width = map.width;
        this.height = map.height;

        this.blocked = new Uint8Array(this.width * this.height);

        this._buildFromLayers(layers);
    }

    static getOrCreate(map, layers, force = false)
    {
        const key = map.key;

        if (!force && gridCache.has(key))
        {
            return gridCache.get(key);
        }

        const grid = new NavigationGrid(
            map,
            layers,
            map.tileWidth,
            map.tileHeight
        );

        gridCache.set(key, grid);

        return grid;
    }

    static get(mapKey)
    {
        return gridCache.get(mapKey) || null;
    }

    _buildFromLayers(layers)
    {
        for (let ty = 0; ty < this.height; ty++)
        {
            for (let tx = 0; tx < this.width; tx++)
            {
                if (this._isBlockedAt(layers, tx, ty))
                {
                    this.blocked[
                        this.index(tx, ty)
                    ] = 1;
                }
            }
        }
    }

    _isBlockedAt(layers, tx, ty)
    {
        if (!this._hasWalkableGround(layers, tx, ty))
        {
            return true;
        }

        for (const layer of Object.values(layers))
        {
            if (!layer || !layer.getTileAt)
            {
                continue;
            }

            const tile = layer.getTileAt(tx, ty);

            if (!tile || tile.index <= 0)
            {
                continue;
            }

            if (tile.collides)
            {
                return true;
            }

            const props = tile.properties;

            if (props && props.collides)
            {
                return true;
            }
        }

        return false;
    }

    _hasWalkableGround(layers, tx, ty)
    {
        for (const name of GROUND_LAYER_NAMES)
        {
            const layer = layers[name];

            if (!layer?.getTileAt)
            {
                continue;
            }

            const tile = layer.getTileAt(tx, ty);

            if (tile && tile.index > 0)
            {
                return true;
            }
        }

        for (const [name, layer] of Object.entries(layers))
        {
            if (
                NON_GROUND_LAYER_NAMES.has(name)
                ||
                /^top\d*$/i.test(name)
                ||
                GROUND_LAYER_NAMES.includes(name)
            )
            {
                continue;
            }

            if (!layer?.getTileAt)
            {
                continue;
            }

            const tile = layer.getTileAt(tx, ty);

            if (tile && tile.index > 0)
            {
                return true;
            }
        }

        return false;
    }

    clampWorldPosition(x, y, margin = NPC_BODY_MARGIN)
    {
        return this.findNearestWalkableWorldPosition(
            x,
            y,
            margin
        );
    }

    getWorldBounds(margin = NPC_BODY_MARGIN)
    {
        const mapW = this.width * this.tileWidth;
        const mapH = this.height * this.tileHeight;

        return {
            minX: margin,
            minY: margin,
            maxX: mapW - margin,
            maxY: mapH - margin
        };
    }

    clampToWorldBounds(x, y, margin = NPC_BODY_MARGIN)
    {
        const bounds = this.getWorldBounds(margin);

        return {
            x: Math.min(
                bounds.maxX,
                Math.max(bounds.minX, x)
            ),
            y: Math.min(
                bounds.maxY,
                Math.max(bounds.minY, y)
            )
        };
    }

    isWithinWorldBounds(x, y, margin = NPC_BODY_MARGIN)
    {
        const bounds = this.getWorldBounds(margin);

        return (
            x >= bounds.minX
            && x <= bounds.maxX
            && y >= bounds.minY
            && y <= bounds.maxY
        );
    }

    findNearestWalkableWorldPosition(x, y, margin = NPC_BODY_MARGIN)
    {
        if (this.isPositionWalkable(x, y, margin))
        {
            return { x, y };
        }

        const { tx, ty } = this.worldToTile(x, y);
        const maxRadius = 12;

        for (let radius = 0; radius <= maxRadius; radius++)
        {
            for (let dy = -radius; dy <= radius; dy++)
            {
                for (let dx = -radius; dx <= radius; dx++)
                {
                    if (
                        radius > 0
                        &&
                        Math.max(
                            Math.abs(dx),
                            Math.abs(dy)
                        ) !== radius
                    )
                    {
                        continue;
                    }

                    const world =
                        this.tileToWorld(
                            tx + dx,
                            ty + dy
                        );

                    if (
                        this.isPositionWalkable(
                            world.x,
                            world.y,
                            margin
                        )
                    )
                    {
                        return world;
                    }
                }
            }
        }

        return this.clampToWorldBounds(
            x,
            y,
            margin
        );
    }

    isPositionWalkable(x, y, margin = NPC_BODY_MARGIN)
    {
        const points = [
            [x, y],
            [x - margin, y],
            [x + margin, y],
            [x, y - margin],
            [x, y + margin],
            [x - margin, y - margin],
            [x + margin, y - margin],
            [x - margin, y + margin],
            [x + margin, y + margin]
        ];

        for (const [px, py] of points)
        {
            const tile = this.worldToTile(px, py);

            if (!this.isWalkable(tile.tx, tile.ty))
            {
                return false;
            }
        }

        return true;
    }

    index(tx, ty)
    {
        return ty * this.width + tx;
    }

    key(tx, ty)
    {
        return `${tx},${ty}`;
    }

    parseKey(key)
    {
        return key.split(',').map(Number);
    }

    tileToWorld(tx, ty)
    {
        return {
            x: tx * this.tileWidth + this.tileWidth / 2,
            y: ty * this.tileHeight + this.tileHeight / 2
        };
    }

    findNearestWalkable(tx, ty)
    {
        if (this.isWalkable(tx, ty))
        {
            return { tx, ty };
        }

        const maxRadius = 8;

        for (let radius = 1; radius <= maxRadius; radius++)
        {
            for (let dy = -radius; dy <= radius; dy++)
            {
                for (let dx = -radius; dx <= radius; dx++)
                {
                    const nx = tx + dx;
                    const ny = ty + dy;

                    if (this.isWalkable(nx, ny))
                    {
                        return { tx: nx, ty: ny };
                    }
                }
            }
        }

        return null;
    }

    isWalkable(tx, ty)
    {
        if (
            tx < 0
            || ty < 0
            || tx >= this.width
            || ty >= this.height
        )
        {
            return false;
        }

        return this.blocked[this.index(tx, ty)] === 0;
    }

    worldToTile(x, y)
    {
        return {
            tx: Math.floor(x / this.tileWidth),
            ty: Math.floor(y / this.tileHeight)
        };
    }
}
