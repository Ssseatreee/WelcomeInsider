import { Scene } from 'phaser';
import NPCManager from '../../systems/NPCManager';
import BgmManager from '../../systems/BgmManager.js';
import AudioSettings from '../../systems/AudioSettings.js';
import levels from '../../data/levels';
// npc映射
import npcMap from '../../gameObjects/npcs/npcs';

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

        this.game.bgmManager =
            new BgmManager(this.game);

        // =========================
        // 当前关卡数据
        // =========================
        const levelData =
            levels[1];

        // =========================
        // 创建全局NPC对象
        // =========================
        levelData.npcs.forEach(
            (npcData, index) => {

                const NPCClass =
                    npcMap[npcData.name];

                // 防止名字写错
                if (!NPCClass)
                {
                    console.warn(
                        `NPC class not found: ${npcData.name}`
                    );

                    return;
                }

                // 创建NPC逻辑对象
                const npc =
                    new NPCClass({

                        id: `npc_${index}`,

                        name: npcData.name,

                        x: npcData.x,

                        y: npcData.y,

                        mapKey: npcData.mapKey,

                        type: npcData.type,

                        moveSpeed: npcData.moveSpeed,

                        hasEmpathy: npcData.hasEmpathy

                    });

                // 注册到全局Manager
                this.game.npcManager
                    .register(npc);

            }
        );

        // =========================
        // 启动Preloader场景
        // =========================
        this.scene.start('Preloader');
    }
}
