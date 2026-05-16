import * as Phaser from "phaser";
export default class Player extends Phaser.Physics.Arcade.Sprite
{
    constructor(scene, x, y)
    {
        super(scene, x, y, 'player', 0);
        this.setFrame(0);

        // 加入scene
        scene.add.existing(this);

        // 开启物理
        scene.physics.add.existing(this);

        // 临时矩形显示
        // this.setTexture('__WHITE');

        // this.setDisplaySize(32, 32);

        // this.setTint(0x00aaff);

        // 设置碰撞体积
        this.body.setSize(24, 24);
        

        // 防止出界
        this.setCollideWorldBounds(true);

        // 键盘输入
        this.cursors = scene.input.keyboard.createCursorKeys();

        // 移速
        this.speed = 200;
    }

    preUpdate(time, delta)
    {
        super.preUpdate(time, delta);

        this.setVelocity(0);

        if (this.cursors.left.isDown)
        {
            this.setVelocityX(-this.speed);
            this.play('player_left', true);
        }
        else if (this.cursors.right.isDown)
        {
            this.setVelocityX(this.speed);
            this.play('player_right', true);
        }

        if (this.cursors.up.isDown)
        {
            this.setVelocityY(-this.speed);
            this.play('player_up', true);
        }
        else if (this.cursors.down.isDown)
        {
            this.setVelocityY(this.speed);
            this.play('player_down', true);
        }
    }
}