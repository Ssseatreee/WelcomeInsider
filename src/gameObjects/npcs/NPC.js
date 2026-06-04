import * as Phaser from 'phaser';
import HunterPathing from '../../systems/HunterPathing.js';

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

        this.minimapColor =
            config.minimapColor ?? 0xffffff;

        this.moveSpeed =
            config.moveSpeed || 1.5;

        this.baseMoveSpeed = this.moveSpeed;
        this._speedBoosted = false;

        // ===== 状态 =====

        this.state = 'idle';

        this.facing = 'down';

        // ===== 游荡 =====

        this.wanderTimer = 0;

        this.vx = 0;
        this.vy = 0;

        this.portalCooldown = 0;

        this.removed = false;

        if (this.type === 'hunter')
        {
            this.pathing = new HunterPathing(this);
        }
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
            if (
                context.hunterGraceActive
                ||
                context.playerWorking
            )
            {
                this.updateHunterGrace(context, delta);
            }
            else
            {
                this.updateHunter(context, delta);
            }

            return;
        }

        if (
            this.type === 'hunter'
            &&
            !this.hasEmpathy
        )
        {
            this.updateBlindHunter(context, delta);
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

    updateBlindHunter(context, delta)
    {
        const { sceneMap } = context;

        if (this.portalCooldown > 0)
        {
            this.portalCooldown -= delta;
        }

        const onSceneMap =
            this.currentMap === sceneMap;

        const movement =
            this.pathing.getBlindVelocity(
                this.currentMap,
                delta
            );

        if (movement.vx !== 0 || movement.vy !== 0)
        {
            if (onSceneMap)
            {
                this.vx = movement.vx;
                this.vy = movement.vy;
            }
            else
            {
                HunterPathing.applyOffSceneWanderStep(
                    this,
                    movement.dx,
                    movement.dy,
                    delta,
                    this.currentMap
                );
                this.vx = 0;
                this.vy = 0;
            }

            this.updateFacing(movement.dx, movement.dy);
        }
        else
        {
            this.vx = 0;
            this.vy = 0;
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

            if (
                !portal
                ||
                portalRegistry.isBlockedMapForNpc(playerMap)
            )
            {
                this.updateHunterFreeRoam(context, delta);
                return;
            }

            const center =
                portalRegistry.getCenter(portal);

            targetX = center.x;
            targetY = center.y;
        }

        const movement =
            onSceneMap
                ? this.pathing.getVelocity(
                    targetX,
                    targetY,
                    this.currentMap,
                    delta
                )
                : this.pathing.directVelocity(
                    targetX,
                    targetY
                );

        if (movement.vx !== 0 || movement.vy !== 0)
        {
            if (onSceneMap)
            {
                this.vx = movement.vx;
                this.vy = movement.vy;
            }
            else
            {
                HunterPathing.applyOffSceneStep(
                    this,
                    movement,
                    delta
                );
                this.vx = 0;
                this.vy = 0;
            }

            this.updateFacing(movement.dx, movement.dy);
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
            this.pathing.reset();
        }
    }

    /** 无法追击玩家时（如玩家在卫生间）或抓捕冷却期内：随机游荡 */
    updateHunterFreeRoam(context, delta)
    {
        const { sceneMap, portalRegistry } = context;

        if (this.portalCooldown > 0)
        {
            this.portalCooldown -= delta;
        }

        const onSceneMap =
            this.currentMap === sceneMap;

        const graceRemaining =
            context.hunterGraceRemaining ?? 0;

        if (this.pathing.wanderTimer <= 0)
        {
            if (graceRemaining > 0)
            {
                this.pathing.startGraceWander(
                    this.currentMap,
                    graceRemaining
                );
            }
            else
            {
                this.pathing.startWander(this.currentMap);
            }
        }

        const movement =
            onSceneMap
                ? this.pathing.getVelocity(
                    this.worldX,
                    this.worldY,
                    this.currentMap,
                    delta
                )
                : this.pathing.getBlindVelocity(
                    this.currentMap,
                    delta
                );

        if (movement.vx !== 0 || movement.vy !== 0)
        {
            if (onSceneMap)
            {
                this.vx = movement.vx;
                this.vy = movement.vy;
            }
            else
            {
                HunterPathing.applyOffSceneWanderStep(
                    this,
                    movement.dx,
                    movement.dy,
                    delta,
                    this.currentMap
                );
                this.vx = 0;
                this.vy = 0;
            }

            this.updateFacing(movement.dx, movement.dy);
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
            this.pathing.reset();
        }
    }

    /** 抓捕对话结束后的短暂游荡 */
    updateHunterGrace(context, delta)
    {
        this.updateHunterFreeRoam(context, delta);
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
