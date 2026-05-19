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

        // ===== 当前关卡数据 =====
        const levelData = levels[this.level];

        // ===== 玩家 =====
        this.player = new Player(
            this,
            levelData.playerSpawn.x,
            levelData.playerSpawn.y
        );

        // ===== NPC =====
        const NPCClass = npcMap[levelData.npc.name];

        this.npc = new NPCClass(
            this,
            levelData.npc.x,
            levelData.npc.y
        );

        // NPC不被撞飞
        this.npc.setStatic(true);

        // ===== 抓捕计数 =====
        this.npcCatchCount = {};

        // ===== 地图管理器 =====
        this.mapManager = new MapManager(this);

        this.mapManager.loadMap('drinkingroom');

        // ===== 图层深度 =====
        let depth = 0;

        Object.values(this.mapManager.layers).forEach(layer => {

            if (layer.name === 'border')return; // border层单独设置深度 
            layer.setDepth(depth);

            depth += 1;

        });

        // top层遮挡
        if (this.mapManager.topLayer)
        {
            this.mapManager.topLayer.setDepth(
                depth + 10
            );
        }
        //border层遮挡
        if (this.mapManager.layers['border'])
        {
            this.mapManager.layers['border'].setDepth(
                depth + 10
            );
        }


        this.player.setDepth(depth + 1);

        this.npc.setDepth(depth + 1);

        // ===== 玩家物理参数 =====
        this.player.setFixedRotation();

        this.player.setFrictionAir(0.15);

        // ===== 对话管理器 =====
        this.dialogueManager =
            new DialogueManager(this);

        // ===== 对话框 =====
        this.dialogBox = this.add.rectangle(
            512,
            650,
            900,
            180,
            0x000000,
            0.8
        );

        this.dialogBox.setScrollFactor(0);

        this.dialogBox.setDepth(200);

        this.dialogBox.setVisible(false);

        // ===== 对话文本 =====
        this.dialogText = this.add.text(
            120,
            590,
            '',
            {
                fontSize: '24px',
                color: '#ffffff',
                wordWrap: {
                    width: 760
                }
            }
        );

        this.dialogText.setScrollFactor(0);

        this.dialogText.setDepth(210);

        this.dialogText.setVisible(false);

        // ===== 对话冷却 =====
        this.dialogCooldown = 1000;

        this.canTriggerDialog = true;

        // ===== Matter碰撞监听 =====
        this.matter.world.on(
            'collisionstart',
            (event) => {

                event.pairs.forEach((pair) => {

                    const bodyA = pair.bodyA;

                    const bodyB = pair.bodyB;

                    const playerBody =
                        this.player.body;

                    const npcBody =
                        this.npc.body;

                    const isPlayerNpcCollision =
                        (
                            bodyA === playerBody &&
                            bodyB === npcBody
                        )
                        ||
                        (
                            bodyA === npcBody &&
                            bodyB === playerBody
                        );

                    if (
                        isPlayerNpcCollision &&
                        this.canTriggerDialog &&
                        !this.dialogueManager.isPlaying
                    )
                    {
                        this.triggerDialog();

                        this.canTriggerDialog = false;

                        this.time.delayedCall(
                            this.dialogCooldown,
                            () => {

                                this.canTriggerDialog = true;

                            }
                        );
                    }
                });
            }
        );

        // ===== 空格键 =====
        this.spaceKey =
            this.input.keyboard.addKey(
                Phaser.Input.Keyboard.KeyCodes.SPACE
            );

        // ===== UI =====
        this.levelText = this.add.text(
            20,
            20,
            `Level ${this.level}`,
            {
                fontSize: '28px',
                color: '#ffffff'
            }
        );

        this.levelText.setScrollFactor(0);

        this.tipText = this.add.text(
            20,
            60,
            '方向键移动',
            {
                fontSize: '18px',
                color: '#aaaaaa'
            }
        );

        this.tipText.setScrollFactor(0);

        // ===== 地图居中偏移 =====
        const offsetX = (this.game.config.width - this.mapManager.map.widthInPixels) / 2;
        const offsetY = (this.game.config.height - this.mapManager.map.heightInPixels) / 2;

        // 平移所有 tilemap layer 的 Matter 碰撞体
        Object.values(this.mapManager.layers).forEach(layer => {
            // // layer.tilemapLayer 可能不存在，遍历 Matter world 的 body
            // this.matter.world.bodies.forEach(body => {
            //     if (body.label === 'Tile Body') { 
            //         // 只平移 tilemap body
            //         Phaser.Physics.Matter.Matter.Body.translate(body, { x: offsetX, y: offsetY });
            //     }
            // });

            // 同时平移渲染贴图
            layer.setPosition(offsetX, offsetY);
        });

        // 平移玩家和 NPC（保持相对位置不变）
        this.player.setPosition(this.player.x + offsetX, this.player.y + offsetY);
        this.npc.setPosition(this.npc.x + offsetX, this.npc.y + offsetY);

                // ===== 摄像机 =====
        this.cameras.main.startFollow(
            this.player,
            true
        );

        this.cameras.main.setBounds(
            0,
            0,
            this.mapManager.map.widthInPixels,
            this.mapManager.map.heightInPixels
        );

        // // ===== Matter世界边界 =====
        // this.matter.world.setBounds(
        //     0,
        //     0,
        //     this.mapManager.map.widthInPixels,
        //     this.mapManager.map.heightInPixels
        // );
    }

    update()
    {
        this.player.preUpdate();

        this.dialogueManager.update();

        // ===== 门交互 =====
        this.mapManager.portals.forEach(portal => {

            const rect =
                new Phaser.Geom.Rectangle(
                    portal.x,
                    portal.y,
                    portal.width,
                    portal.height
                );

            if (
                Phaser.Geom.Rectangle.Overlaps(
                    rect,
                    this.player.getBounds()
                )
            )
            {
                console.log(
                    'Enter Portal:',
                    portal.name
                );
            }
        });

        // ===== 可交互物体 =====
        this.mapManager.objects.forEach(obj => {

            const rect =
                new Phaser.Geom.Rectangle(
                    obj.x,
                    obj.y,
                    obj.width,
                    obj.height
                );

            if (
                Phaser.Geom.Rectangle.Overlaps(
                    rect,
                    this.player.getBounds()
                )
            )
            {
                if (
                    Phaser.Input.Keyboard.JustDown(
                        this.spaceKey
                    )
                )
                {
                    const dialogProp =
                        obj.properties?.find(
                            p => p.name === 'dialog'
                        );

                    if (dialogProp)
                    {
                        this.dialogueManager.start([
                            dialogProp.value
                        ]);
                    }
                }
            }
        });
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