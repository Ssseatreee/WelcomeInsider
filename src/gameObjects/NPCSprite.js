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

        this.setFixedRotation();

        this.setBody({
            type:'rectangle',
            width:24,
            height:24
        });

        this.setDisplaySize(32,32);
    }

    update()
    {
        // 同步世界坐标
        this.setPosition(
            this.entity.worldX,
            this.entity.worldY
        );
    }

    syncFromEntity()
    {
        this.setPosition(
            this.entity.worldX,
            this.entity.worldY
        );
    }
}