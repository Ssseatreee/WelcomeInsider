import Player from '../../gameObjects/Player.js';
import NPC from '../../gameObjects/npcs/NPC.js';

import levels from '../../data/levels';
import DialogueManager from '../../systems/DialogueManager';
import dialogues from '../../data/dialogues';
import GameState from '../../systems/GameState.js';

import npcMap from '../../gameObjects/npcs/npcs.js';

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
        const NPCClass = npcMap[levelData.npc.name];
        this.npc = new NPCClass(
            this, levelData.npc.x, levelData.npc.y
        );

        // ===== 抓捕计数 =====
        this.npcCatchCount = {};

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
        // this.physics.add.overlap(
        //     this.player,
        //     this.npc,
        //     this.triggerDialog,
        //     null,
        //     this
        // );

        // ===== 空格键 =====
        this.spaceKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );

        // ===== 玩家与NPC交互状态 =====
        this.isPlayerTouchingNPC = false;
    }

    update()
    {
        // ===== 对话期间按空格进入下一关 =====

        this.player.preUpdate();
        this.dialogueManager.update();
        
        const isOverlapping =
        this.physics.overlap(
            this.player,
            this.npc
        );

        // 刚进入接触
        if (
            isOverlapping &&
            !this.isPlayerTouchingNPC &&
            !this.dialogueManager.isPlaying
        )
        {
            this.isPlayerTouchingNPC = true;

            this.triggerDialog();
        }

        // 离开接触
        if (!isOverlapping)
        {
            this.isPlayerTouchingNPC = false;
        }
    }

    triggerDialog()
    {
        // 防止重复触发
        // if (this.dialogTriggered)
        // {
        //     return;
        // }

        this.dialogTriggered = true;

        const levelData = levels[this.level];

        const npcName = levelData.npc.name;
        // debug日志
        console.log(`Player caught by ${npcName}`);

        // 增加抓捕次数
        this.npcCatchCount[npcName] = (this.npcCatchCount[npcName] || 0) + 1;
        const catchCount = this.npcCatchCount[npcName];

        let dialogueKey;
        if (catchCount === 1)
        {
            dialogueKey = 'firstCatch';
        }
        else
        {
            dialogueKey = 'secondCatch';
        }
        const dialogue = dialogues[npcName][dialogueKey];


        this.dialogueManager.start(dialogues[npcName][dialogueKey]);
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
        // 对话结束后如果被抓捕超过2次进入下一关
        const npcName = levels[this.level].npc.name;
        const catchCount = this.npcCatchCount[npcName] || 0;
        if (catchCount >= 2)
        {
            this.nextLevel();
        }
    }
}