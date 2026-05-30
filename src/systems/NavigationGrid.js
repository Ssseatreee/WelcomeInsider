const gridCache = new Map();

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

    static getOrCreate(map, layers)
    {
        const key = map.key;

        if (gridCache.has(key))
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
