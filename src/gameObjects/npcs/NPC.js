import * as Phaser from "phaser";

export default class NPC extends Phaser.Physics.Arcade.Sprite
{
    constructor(scene, x, y, texture, npcName)
    {
        super(scene, x, y, texture, 0);

        scene.add.existing(this);

        scene.physics.add.existing(this);

        // this.setTexture('__WHITE');

        this.npcName = npcName;
        this.facing = 'right';

        this.setDisplaySize(32, 32);

        // this.setTint(0xffaa00);

        // this.body.setImmovable(true);
        this.body.setSize(24, 24);
    }

        playDirectionAnimation(direction)
    {
        this.facing = direction;

        this.play(
            `${this.npcName}-${direction}`,
            true
        );
    }
}