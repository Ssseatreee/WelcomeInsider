import Player from '../../gameObjects/Player.js';
import NPC from '../../gameObjects/npcs/NPC.js';

import levels from '../../data/levels';
import DialogueManager from '../../systems/DialogueManager';
import dialogues from '../../data/dialogues';
import GameState from '../../systems/GameState.js';

import MapManager from '../../systems/MapManager.js';

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

        // ===== 加载当前关卡数据 =====
        const levelData = levels[this.level];

        // ===== 玩家 =====
        this.player = new Player(this, levelData.playerSpawn.x, levelData.playerSpawn.y);

        // ===== NPC =====
        const NPCClass = npcMap[levelData.npc.name];
        this.npc = new NPCClass(this, levelData.npc.x, levelData.npc.y);
        this.npcCatchCount = {};

        // ===== 地图管理器 =====
        this.mapManager = new MapManager(this);
        this.mapManager.loadMap('drinkingroom'); // 确保 key 与 preload 一致

        // ===== 居中地图 =====
        const offsetX = (this.game.config.width - this.mapManager.map.widthInPixels) / 2;
        const offsetY = (this.game.config.height - this.mapManager.map.heightInPixels) / 2;

        // 设置所有图层位置偏移
        Object.values(this.mapManager.layers).forEach(layer => layer.setPosition(offsetX, offsetY));

        // ===== 调整玩家和NPC坐标 =====
        this.player.setPosition(this.player.x + offsetX, this.player.y + offsetY);
        this.npc.setPosition(this.npc.x + offsetX, this.npc.y + offsetY);

        // ===== 图层深度 =====
        let depth = 0;
        Object.values(this.mapManager.layers).forEach(layer => {
            layer.setDepth(depth);
            depth += 1;
        });
        this.player.setDepth(depth + 1);
        this.npc.setDepth(depth + 1);

        // ===== 摄像机 =====
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, this.mapManager.map.widthInPixels, this.mapManager.map.heightInPixels);

        // ===== 世界边界 =====
        this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
        this.player.setCollideWorldBounds(true);

        // ===== 玩家与墙体碰撞 =====
        // if (this.mapManager.wallLayer) {
        //     this.physics.add.collider(this.player, this.mapManager.wallLayer);
        //     this.physics.add.collider(this.npc, this.mapManager.wallLayer);
        // }

        // ===== 对话管理器 =====
        this.dialogueManager = new DialogueManager(this);

        // ===== 对话框 =====
        this.dialogBox = this.add.rectangle(400, 520, 700, 100, 0x000000, 0.8).setVisible(false);
        this.dialogText = this.add.text(100, 490, '', {
            fontSize: '22px',
            color: '#ffffff',
            wordWrap: { width: 600 }
        }).setVisible(false);
        this.dialogBox.setDepth(200);
        this.dialogText.setDepth(250);

        this.dialogTriggered = false;
        this.isPlayerTouchingNPC = false;

        // ===== 空格键 =====
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // ===== 关卡文本和提示 =====
        this.levelText = this.add.text(20, 20, `Level ${this.level}`, { fontSize: '28px', color: '#ffffff' });
        this.tipText = this.add.text(20, 60, '方向键移动', { fontSize: '18px', color: '#aaaaaa' });
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
        let dialogueKey;
        // debug日志
        console.log(`Player caught by ${npcName}`);
        // console.log('NPC Name:', npcName);
        // console.log('Dialogue data:', dialogues[npcName]);
        // console.log('Dialogue key:', dialogueKey);

        // 增加抓捕次数
        this.npcCatchCount[npcName] = (this.npcCatchCount[npcName] || 0) + 1;
        const catchCount = this.npcCatchCount[npcName];

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