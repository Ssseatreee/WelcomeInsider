import Player from '../../gameObjects/Player.js';
import NPC from '../../gameObjects/NPC.js';

import levels from '../../data/levels';
import DialogueManager from '../../systems/DialogueManager';

import * as  Phaser from 'phaser';

export default class LevelScene extends Phaser.Scene
{
    constructor()
    {
        super('LevelScene');
    }

    init(data)
    {
        this.level = data.level || 1;
    }

    create()
    {
        // ===== 背景 =====
        this.cameras.main.setBackgroundColor('#2d2d2d');

        // ===== 当前关卡文本 =====
        this.levelText = this.add.text(
            20,
            20,
            `Level ${this.level}`,
            {
                fontSize: '28px',
                color: '#ffffff'
            }
        );

        // ===== 加载当前关卡数据 =====
        const levelData = levels[this.level];

        // ===== 提示文本 =====
        this.tipText = this.add.text(
            20,
            60,
            '方向键移动',
            {
                fontSize: '18px',
                color: '#aaaaaa'
            }
        );

        // ===== 玩家 =====
        this.player = new Player(this, levelData.playerSpawn.x, levelData.playerSpawn.y);

        // ===== NPC =====
        this.npc = new NPC(this, levelData.npc.x, levelData.npc.y);

        // ===== 对话管理器 =====
        this.dialogueManager = new DialogueManager(this);

        // ===== 对话框背景 =====
        this.dialogBox = this.add.rectangle(
            400,
            520,
            700,
            100,
            0x000000,
            0.8
        );

        this.dialogBox.setVisible(false);

        // ===== 对话文本 =====
        this.dialogText = this.add.text(
            100,
            490,
            '',
            {
                fontSize: '22px',
                color: '#ffffff',
                wordWrap: {
                    width: 600
                }
            }
        );

        this.dialogText.setVisible(false);

        // ===== 是否已经触发过对话 =====
        this.dialogTriggered = false;

        // ===== 玩家和NPC碰撞 =====
        this.physics.add.overlap(
            this.player,
            this.npc,
            this.triggerDialog,
            null,
            this
        );

        // ===== 空格键 =====
        this.spaceKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );
    }

    update()
    {
        // ===== 对话期间按空格进入下一关 =====
        // if (
        //     this.dialogTriggered &&
        //     Phaser.Input.Keyboard.JustDown(this.spaceKey)
        // )
        // {
        //     this.nextLevel();
        // }

        this.player.preUpdate();
        this.dialogueManager.update();
    }

    triggerDialog()
    {
        // 防止重复触发
        if (this.dialogTriggered)
        {
            return;
        }

        this.dialogTriggered = true;

        const levelData = levels[this.level];

        this.dialogueManager.start(levelData.dialogue);
    }

    nextLevel()
    {
        if (this.level >= 5) // 5个关卡
        {
            this.scene.start('MainMenuScene');
            return;
        }
        this.scene.restart({
            level: this.level + 1
        });
    }

    onDialogueEnd()
    {
        // 对话结束后进入下一关
        this.nextLevel();
    }
}