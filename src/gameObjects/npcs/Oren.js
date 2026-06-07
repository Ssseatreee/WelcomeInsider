import * as Phaser from 'phaser';
import NPC from './NPC';
import HunterPathing from '../../systems/HunterPathing.js';

export default class Oren extends NPC
{
    static STUCK_MS = 1500;
    static MAP_HOP_CHANCE = 0.28;

    constructor(config)
    {
        super({
            ...config,
            name: 'oren',
            type: 'neutral',
            mapKey: config.mapKey ?? 'drinkingroom',
            minimapColor: 0x74a788,
            moveSpeed: config.moveSpeed ?? 1.8,
            hasEmpathy: false
        });

        this.usesPortals = true;

        this.wanderDx = 0;
        this.wanderDy = 0;
        this.wanderTimer = 0;
        this.stuckTimer = 0;
        this.lastX = null;
        this.lastY = null;
        this.seekingPortal = false;
        this.portalTarget = null;

        this.pickWanderDirection(false);
    }

    convertToHunter()
    {
        this.type = 'hunter';
        this.hasEmpathy = false;
        this.baseMoveSpeed = this.baseMoveSpeed ?? this.moveSpeed;
        this.moveSpeed = 2.5;
        this.seekingPortal = false;
        this.portalTarget = null;
        this.vx = 0;
        this.vy = 0;

        if (!this.pathing)
        {
            this.pathing = new HunterPathing(this);
        }
        else
        {
            this.pathing.reset();
        }
    }

    resetWander()
    {
        this.wanderTimer = 0;
        this.stuckTimer = 0;
        this.lastX = null;
        this.lastY = null;
        this.seekingPortal = false;
        this.portalTarget = null;
        this.vx = 0;
        this.vy = 0;
        this.pickWanderDirection(false);
    }

    pickWanderDirection(onSceneMap = false)
    {
        this.seekingPortal = false;
        this.portalTarget = null;

        let choice;

        if (onSceneMap)
        {
            choice = Phaser.Utils.Array.GetRandom(
                HunterPathing.CARDINAL_DIRS
            );
        }
        else
        {
            choice =
                HunterPathing.pickCardinalWanderDir(
                    this,
                    this.currentMap
                );
        }

        this.wanderDx = choice.x;
        this.wanderDy = choice.y;
        this.facing = choice.dir;

        this.wanderTimer =
            Phaser.Math.Between(2500, 5000);

        this.stuckTimer = 0;
        this.lastX = this.worldX;
        this.lastY = this.worldY;
    }

    tryStartPortalSeek(portalRegistry)
    {
        const portals =
            portalRegistry.getNpcPortalsOnMap(this.currentMap);

        if (portals.length === 0)
        {
            return false;
        }

        const portal =
            Phaser.Utils.Array.GetRandom(portals);

        this.portalTarget =
            portalRegistry.getCenter(portal);

        this.seekingPortal = true;
        this.stuckTimer = 0;
        this.lastX = this.worldX;
        this.lastY = this.worldY;

        return true;
    }

    getMovementToward(tx, ty)
    {
        const dx = tx - this.worldX;
        const dy = ty - this.worldY;
        const dist = Math.hypot(dx, dy);

        if (dist < 1)
        {
            return { vx: 0, vy: 0, dx: 0, dy: 0 };
        }

        return {
            vx: (dx / dist) * this.moveSpeed,
            vy: (dy / dist) * this.moveSpeed,
            dx,
            dy
        };
    }

    updateStuckState(delta, onSceneMap = false)
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

        if (this.stuckTimer >= Oren.STUCK_MS)
        {
            this.pickWanderDirection(onSceneMap);
        }
    }

    update(context, delta)
    {
        if (this.removed)
        {
            this.vx = 0;
            this.vy = 0;
            return;
        }

        if (this.type === 'hunter')
        {
            // 无共感（小地图不可见），但追击时仍感知玩家位置
            this.updateHunter(context, delta);
            return;
        }

        if (this.portalCooldown > 0)
        {
            this.portalCooldown -= delta;
        }

        const onSceneMap =
            this.currentMap === context.sceneMap;

        this.wanderTimer -= delta;

        if (this.wanderTimer <= 0)
        {
            const hopped =
                Math.random() < Oren.MAP_HOP_CHANCE
                &&
                this.tryStartPortalSeek(
                    context.portalRegistry
                );

            if (!hopped)
            {
                this.pickWanderDirection(onSceneMap);
            }
            else
            {
                this.wanderTimer =
                    Phaser.Math.Between(4000, 7000);
            }
        }

        if (this.seekingPortal && this.portalTarget)
        {
            const move = this.getMovementToward(
                this.portalTarget.x,
                this.portalTarget.y
            );

            if (onSceneMap)
            {
                this.vx = move.vx;
                this.vy = move.vy;
                this.updateFacing(move.dx, move.dy);

                if (
                    this.portalCooldown <= 0
                    &&
                    context.portalRegistry.tryPortalTransition(this)
                )
                {
                    this.portalCooldown = 600;
                    this.seekingPortal = false;
                    this.portalTarget = null;
                    this.pickWanderDirection(true);
                }

                return;
            }

            const dist = Math.hypot(move.dx, move.dy);
            let moved = false;

            if (dist > 0)
            {
                const prevX = this.worldX;
                const prevY = this.worldY;

                HunterPathing.applyOffSceneStep(
                    this,
                    move,
                    delta
                );

                moved =
                    Math.hypot(
                        this.worldX - prevX,
                        this.worldY - prevY
                    ) > 0.01;

                this.updateFacing(move.dx, move.dy);
            }

            if (moved)
            {
                if (
                    this.portalCooldown <= 0
                    &&
                    context.portalRegistry.tryPortalTransition(this)
                )
                {
                    this.portalCooldown = 600;
                    this.seekingPortal = false;
                    this.portalTarget = null;
                    this.pickWanderDirection(false);
                }

                this.vx = 0;
                this.vy = 0;

                return;
            }

            this.seekingPortal = false;
            this.portalTarget = null;
            this.pickWanderDirection(false);
        }

        if (onSceneMap)
        {
            this.vx = this.wanderDx * this.moveSpeed;
            this.vy = this.wanderDy * this.moveSpeed;
            return;
        }
        else
        {
            const moved =
                HunterPathing.applyOffSceneWanderStep(
                    this,
                    this.wanderDx,
                    this.wanderDy,
                    delta,
                    this.currentMap
                );

            if (!moved)
            {
                this.pickWanderDirection(false);
            }

            this.vx = 0;
            this.vy = 0;
        }

        this.updateStuckState(delta, false);

        if (
            this.portalCooldown <= 0
            &&
            context.portalRegistry?.tryPortalTransition(this)
        )
        {
            this.portalCooldown = 600;
            this.pickWanderDirection(false);
        }
    }
}
