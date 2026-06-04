import * as Phaser from 'phaser';
import NavigationGrid, {
    NPC_BODY_MARGIN
} from './NavigationGrid.js';
import miniMapLayout from '../data/miniMapLayout.js';

export default class HunterPathing
{
    static STUCK_MS = 2000;
    static WANDER_MS = 3000;
    static WANDER_DIR_MS = 500;
    static NPC_BODY_MARGIN = NPC_BODY_MARGIN;

    static CARDINAL_DIRS = [
        { x: 1, y: 0, dir: 'right' },
        { x: -1, y: 0, dir: 'left' },
        { x: 0, y: 1, dir: 'down' },
        { x: 0, y: -1, dir: 'up' }
    ];

    constructor(entity)
    {
        this.entity = entity;
        this.lastX = null;
        this.lastY = null;
        this.stuckTimer = 0;
        this.wanderTimer = 0;
        this.wanderDirTimer = 0;
        this.wanderVx = 0;
        this.wanderVy = 0;
        this.wanderDx = 0;
        this.wanderDy = 0;
        this.recentWanderDirs = [];
    }

    reset()
    {
        this.lastX = null;
        this.lastY = null;
        this.stuckTimer = 0;
        this.wanderTimer = 0;
        this.wanderDirTimer = 0;
        this.wanderVx = 0;
        this.wanderVy = 0;
        this.wanderDx = 0;
        this.wanderDy = 0;
        this.recentWanderDirs = [];
    }

    getVelocity(targetX, targetY, mapKey, delta)
    {
        this.updateStuckState(delta);

        if (this.wanderTimer > 0)
        {
            this.wanderTimer -= delta;
            this.wanderDirTimer -= delta;

            if (this.wanderDirTimer <= 0)
            {
                this.pickRandomDirection(mapKey);
                this.wanderDirTimer = HunterPathing.WANDER_DIR_MS;
            }

            if (this.wanderTimer <= 0)
            {
                this.wanderTimer = 0;
                this.wanderDirTimer = 0;
                this.stuckTimer = 0;
            }
            else
            {
                this.lastX = this.entity.worldX;
                this.lastY = this.entity.worldY;

                return {
                    vx: this.wanderVx,
                    vy: this.wanderVy,
                    dx: this.wanderDx,
                    dy: this.wanderDy
                };
            }
        }

        if (this.stuckTimer >= HunterPathing.STUCK_MS)
        {
            this.startWander(mapKey);
            this.lastX = this.entity.worldX;
            this.lastY = this.entity.worldY;

            return {
                vx: this.wanderVx,
                vy: this.wanderVy,
                dx: this.wanderDx,
                dy: this.wanderDy
            };
        }

        const movement =
            this.directVelocity(targetX, targetY);

        this.lastX = this.entity.worldX;
        this.lastY = this.entity.worldY;

        return movement;
    }

    getBlindVelocity(mapKey, delta)
    {
        if (
            this.wanderVx === 0
            && this.wanderVy === 0
        )
        {
            this.pickRandomDirection(mapKey);
            this.wanderDirTimer = HunterPathing.WANDER_DIR_MS;
        }

        this.wanderDirTimer -= delta;

        if (this.wanderDirTimer <= 0)
        {
            this.pickRandomDirection(mapKey);
            this.wanderDirTimer = HunterPathing.WANDER_DIR_MS;
        }

        this.updateStuckState(delta);

        if (this.stuckTimer >= HunterPathing.STUCK_MS)
        {
            this.pickRandomDirection(mapKey);
            this.wanderDirTimer = HunterPathing.WANDER_DIR_MS;
            this.stuckTimer = 0;
        }

        this.lastX = this.entity.worldX;
        this.lastY = this.entity.worldY;

        return {
            vx: this.wanderVx,
            vy: this.wanderVy,
            dx: this.wanderDx,
            dy: this.wanderDy
        };
    }

    updateStuckState(delta)
    {
        if (this.wanderTimer > 0)
        {
            return;
        }

        if (this.lastX === null)
        {
            return;
        }

        const moved = Math.hypot(
            this.entity.worldX - this.lastX,
            this.entity.worldY - this.lastY
        );

        if (moved > 0.3)
        {
            this.stuckTimer = 0;
            return;
        }

        this.stuckTimer += delta;
    }

    startWander(mapKey)
    {
        this.wanderTimer = HunterPathing.WANDER_MS;
        this.wanderDirTimer = HunterPathing.WANDER_DIR_MS;
        this.stuckTimer = 0;
        this.recentWanderDirs = [];
        this.pickRandomDirection(mapKey);
    }

    /** 对话结束后的短暂游荡（时长由关卡逻辑传入） */
    startGraceWander(mapKey, durationMs)
    {
        this.wanderTimer = durationMs;
        this.wanderDirTimer = HunterPathing.WANDER_DIR_MS;
        this.stuckTimer = 0;
        this.recentWanderDirs = [];
        this.pickRandomDirection(mapKey);
    }

    pickRandomDirection(mapKey)
    {
        const dirs = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ];

        const grid = NavigationGrid.get(mapKey);
        let available = dirs;

        if (grid)
        {
            const open = dirs.filter(
                dir =>
                    !this.isDirectionBlocked(
                        grid,
                        dir.dx,
                        dir.dy
                    )
            );

            if (open.length > 0)
            {
                available = open;
            }
        }

        const pick =
            this.pickWeightedDirection(available);

        if (this.wanderDx !== 0 || this.wanderDy !== 0)
        {
            this.recentWanderDirs.push({
                dx: this.wanderDx,
                dy: this.wanderDy
            });

            if (this.recentWanderDirs.length > 3)
            {
                this.recentWanderDirs.shift();
            }
        }

        const speed = this.entity.moveSpeed;

        this.wanderVx = pick.dx * speed;
        this.wanderVy = pick.dy * speed;
        this.wanderDx = pick.dx;
        this.wanderDy = pick.dy;
    }

    pickWeightedDirection(available)
    {
        const weighted = available.map(dir => ({
            dir,
            weight: this.getDirectionWeight(dir)
        }));

        const total =
            weighted.reduce(
                (sum, entry) => sum + entry.weight,
                0
            );

        let roll = Math.random() * total;

        for (const entry of weighted)
        {
            roll -= entry.weight;

            if (roll <= 0)
            {
                return entry.dir;
            }
        }

        return weighted[weighted.length - 1].dir;
    }

    getDirectionWeight(dir)
    {
        let weight = 1;

        for (const prev of this.recentWanderDirs)
        {
            if (
                prev.dx !== 0
                && dir.dx === -prev.dx
            )
            {
                weight *= 0.2;
            }

            if (
                prev.dy !== 0
                && dir.dy === -prev.dy
            )
            {
                weight *= 0.2;
            }
        }

        const last =
            this.recentWanderDirs[
                this.recentWanderDirs.length - 1
            ];

        if (
            last
            && dir.dx === last.dx
            && dir.dy === last.dy
        )
        {
            weight *= 0.4;
        }

        return weight;
    }

    isDirectionBlocked(grid, dx, dy)
    {
        const probe = 14;
        const nx =
            this.entity.worldX
            + dx * probe;

        const ny =
            this.entity.worldY
            + dy * probe;

        return !this.canMoveTo(grid, nx, ny);
    }

    canMoveTo(grid, x, y)
    {
        const margin = HunterPathing.NPC_BODY_MARGIN;

        if (
            !grid.isWithinWorldBounds(
                x,
                y,
                margin
            )
        )
        {
            return false;
        }

        const points = [
            [x, y],
            [x - margin, y],
            [x + margin, y],
            [x, y - margin],
            [x, y + margin]
        ];

        for (const [px, py] of points)
        {
            const tile = grid.worldToTile(px, py);

            if (!grid.isWalkable(tile.tx, tile.ty))
            {
                return false;
            }
        }

        return true;
    }

    directVelocity(targetX, targetY)
    {
        const dx = targetX - this.entity.worldX;
        const dy = targetY - this.entity.worldY;
        const len = Math.hypot(dx, dy);

        if (len <= 1)
        {
            return { vx: 0, vy: 0, dx: 0, dy: 0 };
        }

        return {
            vx: dx / len * this.entity.moveSpeed,
            vy: dy / len * this.entity.moveSpeed,
            dx,
            dy
        };
    }

    /**
     * 离屏追击步进 — 沿速度向量推进，事后校正位置（供 hunter 跨图寻路）
     */
    static applyOffSceneStep(entity, movement, delta)
    {
        const frameScale = delta / (1000 / 60);

        entity.worldX += movement.vx * frameScale;
        entity.worldY += movement.vy * frameScale;

        HunterPathing.clampEntity(
            entity,
            entity.currentMap
        );
    }

    static clampEntity(entity, mapKey)
    {
        const grid = NavigationGrid.get(mapKey);
        const margin = HunterPathing.NPC_BODY_MARGIN;

        if (!grid)
        {
            HunterPathing.clampEntityToMapPixels(
                entity,
                mapKey,
                margin
            );

            return;
        }

        const bounded =
            grid.clampToWorldBounds(
                entity.worldX,
                entity.worldY,
                margin
            );

        entity.worldX = bounded.x;
        entity.worldY = bounded.y;

        if (
            grid.isPositionWalkable(
                entity.worldX,
                entity.worldY,
                margin
            )
        )
        {
            return;
        }

        const clamped =
            grid.clampWorldPosition(
                entity.worldX,
                entity.worldY,
                margin
            );

        entity.worldX = clamped.x;
        entity.worldY = clamped.y;
    }

    static clampEntityToMapPixels(entity, mapKey, margin)
    {
        const size =
            miniMapLayout.mapPixelSizes?.[mapKey];

        if (!size)
        {
            return;
        }

        entity.worldX = Math.min(
            size.w - margin,
            Math.max(margin, entity.worldX)
        );

        entity.worldY = Math.min(
            size.h - margin,
            Math.max(margin, entity.worldY)
        );
    }

    static clampEntityIfInvalid(entity, mapKey)
    {
        const grid = NavigationGrid.get(mapKey);

        if (!grid)
        {
            return;
        }

        if (
            grid.isPositionWalkable(
                entity.worldX,
                entity.worldY,
                HunterPathing.NPC_BODY_MARGIN
            )
        )
        {
            return;
        }

        HunterPathing.clampEntity(entity, mapKey);
    }

    /**
     * 离屏游荡步进 — 先推进再校正，失败时分轴滑墙（对齐 Matter 体感）
     */
    static applyOffSceneWanderStep(
        entity,
        dirX,
        dirY,
        delta,
        mapKey
    )
    {
        if (dirX === 0 && dirY === 0)
        {
            return false;
        }

        const prevX = entity.worldX;
        const prevY = entity.worldY;
        const speed = entity.moveSpeed;

        const tryMove = (vx, vy) =>
        {
            entity.worldX = prevX;
            entity.worldY = prevY;

            HunterPathing.applyOffSceneStep(
                entity,
                { vx, vy, dx: dirX, dy: dirY },
                delta
            );

            return (
                Math.hypot(
                    entity.worldX - prevX,
                    entity.worldY - prevY
                ) > 0.01
            );
        };

        if (tryMove(dirX * speed, dirY * speed))
        {
            return true;
        }

        if (dirX !== 0 && tryMove(dirX * speed, 0))
        {
            return true;
        }

        if (dirY !== 0 && tryMove(0, dirY * speed))
        {
            return true;
        }

        entity.worldX = prevX;
        entity.worldY = prevY;

        return false;
    }

    static pickCardinalWanderDir(entity, mapKey)
    {
        const grid = NavigationGrid.get(mapKey);
        const dirs = HunterPathing.CARDINAL_DIRS;

        if (!grid)
        {
            return Phaser.Utils.Array.GetRandom(dirs);
        }

        const step =
            entity.moveSpeed * (1000 / 60);
        const margin = HunterPathing.NPC_BODY_MARGIN;
        const bounds = grid.getWorldBounds(margin);

        const inBounds = (nextX, nextY) =>
            nextX >= bounds.minX
            && nextX <= bounds.maxX
            && nextY >= bounds.minY
            && nextY <= bounds.maxY;

        const open =
            dirs.filter((dir) =>
            {
                const nextX =
                    entity.worldX + dir.x * step;
                const nextY =
                    entity.worldY + dir.y * step;

                return (
                    inBounds(nextX, nextY)
                    &&
                    grid.isPositionWalkable(
                        nextX,
                        nextY,
                        margin
                    )
                );
            });

        if (open.length > 0)
        {
            return Phaser.Utils.Array.GetRandom(open);
        }

        const tileFallback =
            dirs.filter((dir) =>
            {
                const nextX =
                    entity.worldX + dir.x * step;
                const nextY =
                    entity.worldY + dir.y * step;

                if (!inBounds(nextX, nextY))
                {
                    return false;
                }

                const tile = grid.worldToTile(
                    nextX,
                    nextY
                );

                return grid.isWalkable(tile.tx, tile.ty);
            });

        return Phaser.Utils.Array.GetRandom(
            tileFallback.length > 0
                ? tileFallback
                : dirs
        );
    }
}
