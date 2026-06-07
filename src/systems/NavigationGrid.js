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

/** 用于计算 playable 区域外框（取 border 层 tile 的内侧） */
const BORDER_LAYER_NAMES = [
    'border',
    'border1'
];

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
        this._computeWalkableTileBounds();
        this._computeBorderInnerTileBounds(layers);
    }

    /** border 层 tile 外接矩形向内缩 1 格（ playable 区域） */
    _computeBorderInnerTileBounds(layers)
    {
        this.borderInnerMinTx = null;
        this.borderInnerMinTy = null;
        this.borderInnerMaxTx = null;
        this.borderInnerMaxTy = null;

        let borderMinTx = null;
        let borderMinTy = null;
        let borderMaxTx = null;
        let borderMaxTy = null;

        for (const name of BORDER_LAYER_NAMES)
        {
            const layer = layers[name];

            if (!layer?.getTileAt)
            {
                continue;
            }

            for (let ty = 0; ty < this.height; ty++)
            {
                for (let tx = 0; tx < this.width; tx++)
                {
                    const tile = layer.getTileAt(tx, ty);

                    if (!tile || tile.index <= 0)
                    {
                        continue;
                    }

                    if (
                        borderMinTx === null
                        ||
                        tx < borderMinTx
                    )
                    {
                        borderMinTx = tx;
                    }

                    if (
                        borderMaxTx === null
                        ||
                        tx > borderMaxTx
                    )
                    {
                        borderMaxTx = tx;
                    }

                    if (
                        borderMinTy === null
                        ||
                        ty < borderMinTy
                    )
                    {
                        borderMinTy = ty;
                    }

                    if (
                        borderMaxTy === null
                        ||
                        ty > borderMaxTy
                    )
                    {
                        borderMaxTy = ty;
                    }
                }
            }
        }

        if (borderMinTx === null)
        {
            return;
        }

        this.borderInnerMinTx = borderMinTx + 1;
        this.borderInnerMinTy = borderMinTy + 1;
        this.borderInnerMaxTx = borderMaxTx - 1;
        this.borderInnerMaxTy = borderMaxTy - 1;

        if (this.borderInnerMinTx > this.borderInnerMaxTx)
        {
            this.borderInnerMinTx =
                this.borderInnerMaxTx =
                    borderMinTx;
        }

        if (this.borderInnerMinTy > this.borderInnerMaxTy)
        {
            this.borderInnerMinTy =
                this.borderInnerMaxTy =
                    borderMinTy;
        }
    }

    hasBorderInnerRegion()
    {
        return this.borderInnerMinTx !== null;
    }

    _getBoundsTileRange()
    {
        if (this.hasBorderInnerRegion())
        {
            return {
                minTx: this.borderInnerMinTx,
                minTy: this.borderInnerMinTy,
                maxTx: this.borderInnerMaxTx,
                maxTy: this.borderInnerMaxTy
            };
        }

        if (this.hasWalkableRegion())
        {
            return {
                minTx: this.walkableMinTx,
                minTy: this.walkableMinTy,
                maxTx: this.walkableMaxTx,
                maxTy: this.walkableMaxTy
            };
        }

        return null;
    }

    /** 坐标是否在 border 内围（无 border 层时不限制 tile） */
    _isInPlayableTile(tx, ty)
    {
        const range = this._getBoundsTileRange();

        if (!range)
        {
            return true;
        }

        return (
            tx >= range.minTx
            && tx <= range.maxTx
            && ty >= range.minTy
            && ty <= range.maxTy
        );
    }

    _tileRangeToWorldBounds(
        minTx,
        minTy,
        maxTx,
        maxTy,
        margin
    )
    {
        // 与 isPositionWalkable 一致：中心 ±margin 须落在 tile 范围内
        let minX = minTx * this.tileWidth + margin;
        let minY = minTy * this.tileHeight + margin;

        let maxX =
            (maxTx + 1) * this.tileWidth
            - margin * 2;

        let maxY =
            (maxTy + 1) * this.tileHeight
            - margin * 2;

        if (maxX < minX)
        {
            const cx =
                (minTx + maxTx + 1)
                * this.tileWidth
                / 2;

            minX = cx;
            maxX = cx;
        }

        if (maxY < minY)
        {
            const cy =
                (minTy + maxTy + 1)
                * this.tileHeight
                / 2;

            minY = cy;
            maxY = cy;
        }

        return { minX, minY, maxX, maxY };
    }

    /** 可走格子的 tile 坐标外接矩形（忽略未绘制区域） */
    _computeWalkableTileBounds()
    {
        this.walkableMinTx = null;
        this.walkableMinTy = null;
        this.walkableMaxTx = null;
        this.walkableMaxTy = null;

        for (let ty = 0; ty < this.height; ty++)
        {
            for (let tx = 0; tx < this.width; tx++)
            {
                if (!this.isWalkable(tx, ty))
                {
                    continue;
                }

                if (this.walkableMinTx === null || tx < this.walkableMinTx)
                {
                    this.walkableMinTx = tx;
                }

                if (this.walkableMaxTx === null || tx > this.walkableMaxTx)
                {
                    this.walkableMaxTx = tx;
                }

                if (this.walkableMinTy === null || ty < this.walkableMinTy)
                {
                    this.walkableMinTy = ty;
                }

                if (this.walkableMaxTy === null || ty > this.walkableMaxTy)
                {
                    this.walkableMaxTy = ty;
                }
            }
        }
    }

    hasWalkableRegion()
    {
        return this.walkableMinTx !== null;
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
        const range = this._getBoundsTileRange();

        if (range)
        {
            return this._tileRangeToWorldBounds(
                range.minTx,
                range.minTy,
                range.maxTx,
                range.maxTy,
                margin
            );
        }

        const mapW = this.width * this.tileWidth;
        const mapH = this.height * this.tileHeight;

        return {
            minX: margin,
            minY: margin,
            maxX: mapW - margin * 2,
            maxY: mapH - margin * 2
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

    isValidNpcPosition(x, y, margin = NPC_BODY_MARGIN)
    {
        return (
            this.isWithinWorldBounds(x, y, margin)
            &&
            this.isPositionWalkable(x, y, margin)
        );
    }

    findNearestWalkableWorldPosition(x, y, margin = NPC_BODY_MARGIN)
    {
        if (this.isValidNpcPosition(x, y, margin))
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
                        !this._isInPlayableTile(
                            tx + dx,
                            ty + dy
                        )
                    )
                    {
                        continue;
                    }

                    const candidate =
                        this.clampToWorldBounds(
                            world.x,
                            world.y,
                            margin
                        );

                    if (
                        this.isValidNpcPosition(
                            candidate.x,
                            candidate.y,
                            margin
                        )
                    )
                    {
                        return candidate;
                    }
                }
            }
        }

        const range = this._getBoundsTileRange();

        if (range)
        {
            for (
                let ty = range.minTy;
                ty <= range.maxTy;
                ty++
            )
            {
                for (
                    let tx = range.minTx;
                    tx <= range.maxTx;
                    tx++
                )
                {
                    if (!this.isWalkable(tx, ty))
                    {
                        continue;
                    }

                    const world = this.tileToWorld(tx, ty);

                    const candidate =
                        this.clampToWorldBounds(
                            world.x,
                            world.y,
                            margin
                        );

                    if (
                        this.isValidNpcPosition(
                            candidate.x,
                            candidate.y,
                            margin
                        )
                    )
                    {
                        return candidate;
                    }
                }
            }
        }

        return this.findAnyValidNpcPosition(margin);
    }

    /** 兜底：仅在 border 内围 / 可走区矩形内找合法站位 */
    findAnyValidNpcPosition(margin = NPC_BODY_MARGIN)
    {
        const range = this._getBoundsTileRange();

        if (!range)
        {
            return {
                x: this.tileWidth / 2,
                y: this.tileHeight / 2
            };
        }

        for (
            let ty = range.minTy;
            ty <= range.maxTy;
            ty++
        )
        {
            for (
                let tx = range.minTx;
                tx <= range.maxTx;
                tx++
            )
            {
                if (!this.isWalkable(tx, ty))
                {
                    continue;
                }

                const world = this.tileToWorld(tx, ty);

                const candidate =
                    this.clampToWorldBounds(
                        world.x,
                        world.y,
                        margin
                    );

                if (
                    this.isValidNpcPosition(
                        candidate.x,
                        candidate.y,
                        margin
                    )
                )
                {
                    return candidate;
                }
            }
        }

        const cx = Math.floor(
            (range.minTx + range.maxTx) / 2
        );
        const cy = Math.floor(
            (range.minTy + range.maxTy) / 2
        );
        const world = this.tileToWorld(cx, cy);

        return this.clampToWorldBounds(
            world.x,
            world.y,
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

            if (!this._isInPlayableTile(tile.tx, tile.ty))
            {
                return false;
            }

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
