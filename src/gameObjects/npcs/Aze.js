import * as Phaser from 'phaser';
import NPC from './NPC';
import NavigationGrid from '../../systems/NavigationGrid.js';

export default class Aze extends NPC
{
    static MAP_KEY = 'drinkingroom';
    static STUCK_MS = 1500;

    constructor(config)
    {
        super({
            ...config,
            name: 'aze',
            type: 'neutral',
            mapKey: config.mapKey ?? Aze.MAP_KEY,
            minimapColor: 0x719686,
            moveSpeed: config.moveSpeed ?? 1.2
        });

        this.wanderDx = 0;
        this.wanderDy = 0;
        this.wanderTimer = 0;
        this.stuckTimer = 0;
        this.lastX = null;
        this.lastY = null;

        this.pickWanderDirection();
    }

    resetWander()
    {
        this.wanderTimer = 0;
        this.stuckTimer = 0;
        this.lastX = null;
        this.lastY = null;
        this.vx = 0;
        this.vy = 0;
        this.pickWanderDirection();
    }

    pickWanderDirection()
    {
        const dirs = [
            { x: 1, y: 0, dir: 'right' },
            { x: -1, y: 0, dir: 'left' },
            { x: 0, y: 1, dir: 'down' },
            { x: 0, y: -1, dir: 'up' }
        ];

        const grid =
            NavigationGrid.get(Aze.MAP_KEY);

        let available = dirs;

        if (grid)
        {
            const tile =
                grid.worldToTile(
                    this.worldX,
                    this.worldY
                );

            const open = dirs.filter(dir =>
                grid.isWalkable(
                    tile.tx + dir.x,
                    tile.ty + dir.y
                )
            );

            if (open.length > 0)
            {
                available = open;
            }
        }

        const choice =
            Phaser.Utils.Array.GetRandom(available);

        this.wanderDx = choice.x;
        this.wanderDy = choice.y;
        this.facing = choice.dir;

        this.wanderTimer =
            Phaser.Math.Between(2500, 5000);

        this.stuckTimer = 0;
        this.lastX = this.worldX;
        this.lastY = this.worldY;
    }

    updateStuckState(delta)
    {
        if (this.lastX === null)
        {
            this.lastX = this.worldX;
            this.lastY = this.worldY;
            return;
        }

        const moved = Math.hypot(
            this.worldX - this.lastX,
            this.worldY - this.lastY
        );

        if (moved > 0.3)
        {
            this.stuckTimer = 0;
            this.lastX = this.worldX;
            this.lastY = this.worldY;
            return;
        }

        this.stuckTimer += delta;

        if (this.stuckTimer >= Aze.STUCK_MS)
        {
            this.pickWanderDirection();
        }
    }

    update(context, delta)
    {
        if (
            this.removed
            ||
            this.currentMap !== Aze.MAP_KEY
        )
        {
            this.vx = 0;
            this.vy = 0;
            return;
        }

        const onSceneMap =
            this.currentMap === context.sceneMap;

        this.wanderTimer -= delta;

        if (this.wanderTimer <= 0)
        {
            this.pickWanderDirection();
        }

        if (onSceneMap)
        {
            this.vx = this.wanderDx * this.moveSpeed;
            this.vy = this.wanderDy * this.moveSpeed;
            this.updateStuckState(delta);
            return;
        }

        // 离屏时仍用逻辑坐标模拟（无 Matter 碰撞体）
        const frameScale = delta / (1000 / 60);
        const step = this.moveSpeed * frameScale;

        this.worldX += this.wanderDx * step;
        this.worldY += this.wanderDy * step;
        this.vx = 0;
        this.vy = 0;
    }
}
