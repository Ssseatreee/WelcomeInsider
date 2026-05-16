import * as Phaser from "phaser";

export default class NPC extends Phaser.Physics.Arcade.Sprite
{
    constructor(scene, x, y)
    {
        super(scene, x, y);

        scene.add.existing(this);

        scene.physics.add.existing(this);

        this.setTexture('__WHITE');

        this.setDisplaySize(32, 32);

        this.setTint(0xffaa00);

        this.body.setImmovable(true);
        this.body.setSize(4, 4);
    }
}