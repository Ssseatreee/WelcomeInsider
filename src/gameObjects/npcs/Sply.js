import * as Phaser from 'phaser';
import NPC from './NPC';
import HunterPathing from '../../systems/HunterPathing.js';

export default class Sply extends NPC
{
    static STUCK_MS = 1500;

    constructor(config)
    {
        super({
            ...config,
            name: 'sply',
            hasEmpathy: true,
            type: 'neutral',
            mapKey: config.mapKey ?? 'hall',
            minimapColor: 0x88b2c5,
            moveSpeed: config.moveSpeed ?? 1.2
        });

        this.wanderMapKey = this.currentMap;

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
        const choice =
            HunterPathing.pickCardinalWanderDir(
                this,
                this.wanderMapKey
            );

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

        if (this.stuckTimer >= Sply.STUCK_MS)
        {
            this.pickWanderDirection();
        }
    }

    update(context, delta)
    {
        if (
            this.removed
            ||
            this.currentMap !== this.wanderMapKey
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
            this.pickWanderDirection();
        }

        this.updateStuckState(delta);

        this.vx = 0;
        this.vy = 0;
    }
}
