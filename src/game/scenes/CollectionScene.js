import {Scene} from 'phaser'

export default class CollectionScene extends Scene
{
    constructor()
    {
        super('CollectionScene');
    }

    create()
    {
        this.cameras.main.setBackgroundColor('#222222');

        this.add.text(400, 100, '收集物界面', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const backButton = this.add.text(400, 500, '返回主菜单', {
            fontSize: '24px',
            backgroundColor: '#333333',
            padding: {
                left: 15,
                right: 15,
                top: 10,
                bottom: 10
            }
        })
        .setOrigin(0.5)
        .setInteractive();

        backButton.on('pointerdown', () =>
        {
            this.scene.start('MainMenuScene');
        });
    }
}