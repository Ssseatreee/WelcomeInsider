import * as Phaser from 'phaser';

export default class NPCSprite
extends Phaser.Physics.Matter.Sprite
{
    constructor(scene, entity, texture)
    {
        super(
            scene.matter.world,
            entity.worldX,
            entity.worldY,
            texture,
            0
        );

        this.entity = entity;

        scene.add.existing(this);

        this.setBody({
            type:'rectangle',
            width:24,
            height:24
        });

        // setBody 会重置刚体属性，必须在之后调用
        this.setFixedRotation();

        this.setDisplaySize(32,32);

        if (entity.type === 'hunter')
        {
            // 猎人用物理速度移动，才能与地图碰撞体发生作用
            this.setFrictionAir(0.15);
        }
        else
        {
            // 普通 NPC 由逻辑层驱动位置
            this.setStatic(true);
        }

        this.playAnimation();
    }

    preUpdate(time, delta)
    {
        super.preUpdate(time, delta);

        if (this.entity.type !== 'hunter')
        {
            return;
        }

        if (
            this.scene.dialogueManager?.isPlaying
            ||
            this.scene.dialogueManager?.isShowingObjectDialogue
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

        if (
            this.entity.portalCooldown <= 0
            &&
            this.scene.portalRegistry?.tryPortalTransition(
                this.entity
            )
        )
        {
            this.entity.portalCooldown = 600;

            if (this.entity.currentMap === this.scene.currentMap)
            {
                this.setPosition(
                    this.entity.worldX,
                    this.entity.worldY
                );
            }
        }

        this.playAnimation();
    }

    syncFromEntity()
    {
        if (this.entity.type === 'hunter')
        {
            return;
        }

        this.setPosition(
            this.entity.worldX,
            this.entity.worldY
        );

        this.playAnimation();
    }

    playAnimation()
    {
        const key =
            `${this.entity.npcName}-${this.entity.facing}`;

        const anim =
            this.scene.anims.get(key);

        if (!anim)
        {
            return;
        }

        const animFrame =
            anim.frames[0];

        this.setFrame(
            animFrame.frame,
            false,
            false
        );
    }

    spawn(scene)
    {
        scene.add.existing(this);
        this.setActive(true);
        this.setVisible(true);
        this.syncFromEntity();
    }

    despawn()
    {
        this.setActive(false);
        this.setVisible(false);

        if (this.scene)
        {
            this.scene.children.remove(this);
        }
    }
}
