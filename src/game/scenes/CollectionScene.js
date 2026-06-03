import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import {
    playEnterIfNeeded,
    readCurtainEnter,
    readCurtainTurnKey,
    transitionToScene
} from '../../systems/CurtainTransition.js';

export default class CollectionScene extends Scene
{
    constructor()
    {
        super('CollectionScene');
    }

    init(data)
    {
        this.curtainEnter = readCurtainEnter(data);
        this.curtainTurnKey = readCurtainTurnKey(data);
        this._curtainTransitioning = false;
        this._returningToMenu = false;
    }

    create()
    {
        this.input.enabled = true;
        this._curtainTransitioning = false;
        this._returningToMenu = false;

        this.cameras.main.setBackgroundColor('#222222');

        const cx = this.scale.width / 2;

        this.add.text(cx, 100, '收集物界面', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const backButton =
            this.add.text(cx, 500, '返回主菜单', {
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
            .setInteractive({ useHandCursor: true });

        backButton.on('pointerup', () =>
        {
            this.returnToMainMenu();
        });

        if (this.input.keyboard)
        {
            this.escKey =
                this.input.keyboard.addKey(
                    Phaser.Input.Keyboard.KeyCodes.ESC
                );
        }

        playEnterIfNeeded(this);

        this.game.bgmManager?.playMenu(this);
    }

    update()
    {
        if (
            this.escKey
            &&
            Phaser.Input.Keyboard.JustDown(this.escKey)
        )
        {
            this.returnToMainMenu();
        }
    }

    returnToMainMenu()
    {
        if (this._returningToMenu)
        {
            return;
        }

        this._returningToMenu = true;
        this._curtainTransitioning = false;
        this.input.enabled = true;

        transitionToScene(this, 'MainMenuScene');
    }
}
