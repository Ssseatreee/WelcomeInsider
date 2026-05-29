import * as Phaser from 'phaser';

export default class NPC
{
    constructor(config)
    {
        // ===== 基础 =====

        this.id = config.id;

        this.npcName =
            config.name;

        // ===== 世界状态 =====

        this.currentMap =
            config.mapKey || 'hall';

        this.worldX =
            config.x || 0;

        this.worldY =
            config.y || 0;

        // ===== 类型 =====

        this.type =
            config.type || 'civilian';

        this.hasEmpathy =
            config.hasEmpathy || false;

        this.moveSpeed =
            config.moveSpeed || 1.5;

        // ===== 状态 =====

        this.state = 'idle';

        this.facing = 'down';

        // ===== 游荡 =====

        this.wanderTimer = 0;

        this.vx = 0;
        this.vy = 0;

        this.portalCooldown = 0;
    }

    update(context, delta)
    {
        // ===== Hunter AI =====

        if (
            this.type === 'hunter'
            &&
            this.hasEmpathy
        )
        {
            this.updateHunter(context, delta);
            return;
        }

        this.vx = 0;
        this.vy = 0;

        // ===== 普通NPC随机移动 =====

        this.wanderTimer -= delta;

        if (this.wanderTimer <= 0)
        {
            const dirs = [
                { x: 1, y: 0, dir: 'right' },
                { x: -1, y: 0, dir: 'left' },
                { x: 0, y: 1, dir: 'down' },
                { x: 0, y: -1, dir: 'up' }
            ];

            const choice =
                Phaser.Utils.Array.GetRandom(
                    dirs
                );

            this.worldX +=
                choice.x * 16;

            this.worldY +=
                choice.y * 16;

            this.facing =
                choice.dir;

            this.wanderTimer =
                Phaser.Math.Between(
                    1000,
                    3000
                );
        }
    }

    updateHunter(context, delta)
    {
        const {
            player,
            playerMap,
            sceneMap,
            portalRegistry
        } = context;

        if (this.portalCooldown > 0)
        {
            this.portalCooldown -= delta;
        }

        const onSceneMap =
            this.currentMap === sceneMap;

        let targetX;
        let targetY;

        if (this.currentMap === playerMap)
        {
            targetX = player.x;
            targetY = player.y;
        }
        else
        {
            const portal =
                portalRegistry.getNextPortal(
                    this.currentMap,
                    playerMap,
                    this.worldX,
                    this.worldY
                );

            if (!portal)
            {
                this.vx = 0;
                this.vy = 0;
                return;
            }

            const center =
                portalRegistry.getCenter(portal);

            targetX = center.x;
            targetY = center.y;
        }

        const dx =
            targetX - this.worldX;

        const dy =
            targetY - this.worldY;

        const len =
            Math.hypot(dx, dy);

        if (len > 1)
        {
            const vx =
                dx / len * this.moveSpeed;

            const vy =
                dy / len * this.moveSpeed;

            if (onSceneMap)
            {
                this.vx = vx;
                this.vy = vy;
            }
            else
            {
                this.worldX += vx;
                this.worldY += vy;
                this.vx = 0;
                this.vy = 0;
            }

            this.updateFacing(dx, dy);
        }
        else
        {
            this.vx = 0;
            this.vy = 0;
        }

        if (
            !onSceneMap
            &&
            this.portalCooldown <= 0
            &&
            portalRegistry.tryPortalTransition(this)
        )
        {
            this.portalCooldown = 600;
        }
    }

    updateFacing(dx, dy)
    {
        if (Math.abs(dx) > Math.abs(dy))
        {
            this.facing =
                dx > 0
                    ? 'right'
                    : 'left';
        }
        else
        {
            this.facing =
                dy > 0
                    ? 'down'
                    : 'up';
        }
    }
}
