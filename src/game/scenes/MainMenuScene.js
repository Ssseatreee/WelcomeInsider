import { Scene } from 'phaser';

export default class MainMenuScene extends Scene
{
    constructor()
    {
        super('MainMenuScene');
    }

    create()
    {
        // ===== 背景 =====
        this.cameras.main.setBackgroundColor('#1e1e1e');

        // ===== 标题 =====
        this.add.text(
            this.scale.width / 2,
            120,
            '隐现的工作周报',
            {
                fontSize: '42px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // ===== 副标题 =====
        this.add.text(
            this.scale.width / 2,
            180,
            '没工作才是好员工啊',
            {
                fontSize: '20px',
                color: '#aaaaaa'
            }
        ).setOrigin(0.5);

        // ===== 开始游戏按钮 =====
        const startButton = this.createButton(
            this.scale.width / 2,
            320,
            '开始游戏'
        );

        startButton.on('pointerdown', () =>
        {
            this.scene.start('LevelScene', {
                level: 1
            });
        });

        // ===== 收藏按钮 =====
        const collectionButton = this.createButton(
            this.scale.width / 2,
            400,
            '查看收集物'
        );

        collectionButton.on('pointerdown', () =>
        {
            this.scene.start('CollectionScene');
        });

        // ===== 底部提示 =====
        this.add.text(
            this.scale.width / 2,
            540,
            'Powered by Phaser',
            {
                fontSize: '14px',
                color: '#666666'
            }
        ).setOrigin(0.5);
    }

    createButton(x, y, text)
    {
        const button = this.add.text(
            x,
            y,
            text,
            {
                fontSize: '28px',
                backgroundColor: '#333333',
                color: '#ffffff',
                padding: {
                    left: 20,
                    right: 20,
                    top: 10,
                    bottom: 10
                }
            }
        )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        // ===== hover效果 =====
        button.on('pointerover', () =>
        {
            button.setStyle({
                backgroundColor: '#555555'
            });
        });

        button.on('pointerout', () =>
        {
            button.setStyle({
                backgroundColor: '#333333'
            });
        });

        return button;
    }
}