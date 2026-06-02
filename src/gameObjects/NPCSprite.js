import * as Phaser from 'phaser';
import HunterPathing from '../systems/HunterPathing.js';

export default class NPCSprite
extends Phaser.Physics.Matter.Sprite
{
    static textureKey(npcName)
    {
        return `npc-${npcName}`;
    }

    static usesPhysicsMovement(entity)
    {
        return (
            entity.type === 'hunter'
            ||
            entity.type === 'neutral'
        );
    }

    constructor(scene, entity)
    {
        const textureKey =
            NPCSprite.textureKey(entity.npcName);

        super(
            scene.matter.world,
            entity.worldX,
            entity.worldY,
            textureKey,
            0
        );

        this.entity = entity;
        this._onMap = false;

        scene.add.existing(this);

        this.setFrame(0);
        this.setFixedRotation();

        this.setBody({
            type: 'rectangle',
            width: 24,
            height: 24
        });

        if (NPCSprite.usesPhysicsMovement(entity))
        {
            this.setFrictionAir(0.15);
        }
        else
        {
            this.setStatic(true);
        }

        // 默认隐藏，等 refreshNPCSprites 决定当前地图可见性
        this.setVisible(false);
        this.setActive(false);

        // 离屏 NPC 不应占用物理世界（否则 debug 会显示残留碰撞体）
        scene.matter.world.remove(this.body);

        this.applyFrame(true);
    }

    setOnMap(onMap)
    {
        // 始终同步可见性（构造时 _onMap 已是 false，不能因 early return 跳过 hide）
        this.setVisible(onMap);
        this.setActive(onMap);

        const world =
            this.scene?.matter?.world;

        if (onMap === this._onMap)
        {
            return;
        }

        this._onMap = onMap;

        if (!world || !this.body)
        {
            return;
        }

        if (onMap)
        {
            if (NPCSprite.usesPhysicsMovement(this.entity))
            {
                HunterPathing.clampEntity(
                    this.entity,
                    this.entity.currentMap
                );
            }

            this.setPosition(
                this.entity.worldX,
                this.entity.worldY
            );

            this.setVelocity(
                this.entity.vx,
                this.entity.vy
            );

            this.setFixedRotation();

            if (!world.has(this.body))
            {
                world.add(this.body);
            }

            this.applyFrame(true);
        }
        else
        {
            this.entity.worldX = this.x;
            this.entity.worldY = this.y;

            HunterPathing.clampEntity(
                this.entity,
                this.entity.currentMap
            );

            this.setVelocity(0, 0);

            if (world.has(this.body))
            {
                world.remove(this.body);
            }
        }
    }

    preUpdate(time, delta)
    {
        super.preUpdate(time, delta);

        if (!this._onMap)
        {
            return;
        }

        if (!NPCSprite.usesPhysicsMovement(this.entity))
        {
            this.setPosition(
                this.entity.worldX,
                this.entity.worldY
            );
            this.applyFrame();
            return;
        }

        if (
            this.scene.isResultShowing
            ||
            this.scene.dialogueManager?.isPlaying
        )
        {
            this.setVelocity(0, 0);
            return;
        }

        this.setVelocity(
            this.entity.vx,
            this.entity.vy
        );

        this.entity.worldX = this.x;
        this.entity.worldY = this.y;

        if (NPCSprite.usesPhysicsMovement(this.entity))
        {
            HunterPathing.clampEntityIfInvalid(
                this.entity,
                this.entity.currentMap
            );

            this.setPosition(
                this.entity.worldX,
                this.entity.worldY
            );
        }

        if (this.entity.type === 'hunter')
        {
            if (
                this.entity.portalCooldown <= 0
                &&
                this.scene.portalRegistry?.tryPortalTransition(
                    this.entity
                )
            )
            {
                this.entity.portalCooldown = 600;
                this.entity.pathing?.reset();

                this.setPosition(
                    this.entity.worldX,
                    this.entity.worldY
                );
            }
        }
        else if (this.entity.usesPortals)
        {
            if (
                this.entity.portalCooldown <= 0
                &&
                this.scene.portalRegistry?.tryPortalTransition(
                    this.entity
                )
            )
            {
                this.entity.portalCooldown = 600;

                this.setPosition(
                    this.entity.worldX,
                    this.entity.worldY
                );
            }
        }

        this.applyFrame();
    }

    syncFromEntity()
    {
        if (!this._onMap)
        {
            return;
        }

        const dm = this.scene.dialogueManager;

        if (NPCSprite.usesPhysicsMovement(this.entity))
        {
            if (!dm?.isPlaying)
            {
                this.setVelocity(
                    this.entity.vx,
                    this.entity.vy
                );
            }
        }
        else
        {
            this.setPosition(
                this.entity.worldX,
                this.entity.worldY
            );
        }

        this.applyFrame(true);
    }

    applyFrame(force = false)
    {
        const animKey =
            `${this.entity.npcName}-${this.entity.facing}`;

        if (!this.scene.anims.exists(animKey))
        {
            return;
        }

        if (
            force
            ||
            this.anims.currentAnim?.key !== animKey
        )
        {
            this.play(animKey, true);
        }
    }

    despawn()
    {
        this.setActive(false);
        this.setVisible(false);
        this.setVelocity(0, 0);

        const world =
            this.scene?.matter?.world;

        if (world && this.body)
        {
            world.remove(this.body);
        }

        this.destroy();
    }
}
