import * as Phaser from "phaser";

export default class NPC extends Phaser.Physics.Matter.Sprite
{
    constructor(scene, x, y, texture, npcName)
    {
        // 使用 Matter World 创建 sprite
        super(scene.matter.world, x, y, texture, 0);

        // 加入 scene
        scene.add.existing(this);

        this.npcName = npcName;
        this.facing = 'right';

        // 防止旋转
        this.setFixedRotation();

        // 设置碰撞体
        this.setBody({
            type: 'rectangle',
            width: 24,
            height: 24
        });

        // 设置显示尺寸（贴图缩放）
        this.setDisplaySize(32, 32);

        // 可选：标记为 NPC
        this.isNPC = true;
    }

    playDirectionAnimation(direction)
    {
        this.facing = direction;

        this.play(
            `${this.npcName}-${direction}`,
            true
        );
    }

    // 如果需要，NPC 移动可以用 Matter setVelocity
    move(dx, dy)
    {
        this.setVelocity(dx, dy);
    }

    update()
    {
        // 这里可以放 NPC AI 或巡逻逻辑
    }
}