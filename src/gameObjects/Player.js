import * as Phaser from 'phaser';

export default class Player extends Phaser.Physics.Matter.Sprite
{
    constructor(scene, x, y)
    {
        // Matter Sprite
        super(
            scene.matter.world,
            x,
            y,
            'player',
            0
        );

        // 加入scene
        scene.add.existing(this);

        // 初始帧
        this.setFrame(0);

        // 防止旋转
        this.setFixedRotation();

        // 设置碰撞体
        this.setBody({
            type: 'rectangle',
            width: 24,
            height: 24
        });

        // 防止出界
        this.setFixedRotation();

        // 键盘输入
        this.cursors =
            scene.input.keyboard.createCursorKeys();

        // 移速
        this.speed = 3.5;
    }

    preUpdate(time, delta)
    {
        super.preUpdate(time, delta);

        // 清空速度
        this.setVelocity(0, 0);

        let vx = 0;
        let vy = 0;

        // 左右移动
        if (this.cursors.left.isDown)
        {
            vx = -this.speed;
            this.play('player_left', true);
        }
        else if (this.cursors.right.isDown)
        {
            vx = this.speed;
            this.play('player_right', true);
        }

        // 上下移动
        if (this.cursors.up.isDown)
        {
            vy = -this.speed;
            this.play('player_up', true);
        }
        else if (this.cursors.down.isDown)
        {
            vy = this.speed;
            this.play('player_down', true);
        }

        // 应用速度
        this.setVelocity(vx, vy);

        // 没移动时停止动画
        if (vx === 0 && vy === 0)
        {
            this.stop();
        }
    }
}