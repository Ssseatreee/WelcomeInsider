import { Scene } from 'phaser';
import NPCManager from '../../systems/NPCManager';
import BgmManager from '../../systems/BgmManager.js';
import AudioSettings from '../../systems/AudioSettings.js';
import AchievementManager from '../../systems/AchievementManager.js';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

        //         this.load.image('background', 'assets/bg.png');

        this.load.image('ui-left', './assets/UI/left.png');
        this.load.image('ui-right', './assets/UI/right.png');
        this.load.image('ui-donut', './assets/UI/donut.png');
    }

    create ()
    {
        // =========================
        // 创建全局NPCManager
        // =========================
        this.game.npcManager =
            new NPCManager();

        AudioSettings.load();
        AudioSettings.bindGame(this.game);

        AchievementManager.load();

        this.game.bgmManager =
            new BgmManager(this.game);

        // =========================
        // 启动Preloader场景
        // =========================
        this.scene.start('Preloader');
    }
}
