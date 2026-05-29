import Player from '../../gameObjects/Player.js';
import NPCSprite from '../../gameObjects/NPCSprite.js';

import levels from '../../data/levels';
import DialogueManager from '../../systems/DialogueManager';
import dialogues from '../../data/dialogues';
import GameState from '../../systems/GameState.js';

import MapManager from '../../systems/MapManager.js';
import PortalRegistry from '../../systems/PortalRegistry.js';

import mapDisplayNames from '../../data/mapDisplayNames.js';

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

        // ===== 当前地图 =====
        this.currentMap = 'drinkingroom';

        this.portalRegistry = new PortalRegistry();

        this.npcCatchCount = {};
        // ===== NPCManager =====
        this.npcManager =
            this.game.npcManager;

        // ===== 当前Scene中的Sprite =====
        this.npcSprites = [];

        // ===== 地图管理器 =====
        this.mapManager = new MapManager(this);

        this.mapManager.loadMap('drinkingroom');

        this.refreshNPCSprites();
        let depth = 0;

        Object.values(this.mapManager.layers).forEach(layer => {

            if (layer.name === 'border')return; // border层单独设置深度 
            layer.setDepth(depth);

            depth += 1;

        });

        // top层遮挡
        if (this.mapManager.topLayer)
        {
            // this.mapManager.topLayer.setDepth(
            //     depth + 10
            // );
            this.mapManager.topLayer.forEach(
                layer=>layer.setDepth(depth+10)
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

        this.npcSprites.forEach(sprite=>{
            sprite.setDepth(depth+1);
        });

        // ===== 玩家物理参数 =====
        this.player.setFixedRotation();

        this.player.setFrictionAir(0.15);

        // ===== 对话管理器 =====
        this.dialogueManager =
            new DialogueManager(this);


        // ===== 对话冷却 =====
        this.dialogCooldown = 1000;

        this.canTriggerDialog = true;

        // ===== Matter碰撞监听 =====
        this.npcDialogCooldown = new Set();

        this.matter.world.on('collisionstart', (event) => {

            event.pairs.forEach((pair) => {

                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;

                const playerBody = this.player.body;

                // ===== 找到 NPC =====
                const npcSprite =
                    this.npcSprites.find(
                        sprite =>
                            sprite.body === bodyA
                            ||
                            sprite.body === bodyB
                    );

                if (!npcSprite) return;

                // ===== 必须是玩家碰 NPC =====
                const isPlayerNpc =
                    (bodyA === playerBody && bodyB === npcSprite.body) ||
                    (bodyB === playerBody && bodyA === npcSprite.body);

                if (!isPlayerNpc) return;

                // ===== NPC 冷却（关键）=====
                if (this.npcDialogCooldown.has(npcSprite.entity)) return;

                this.npcDialogCooldown.add(npcSprite.entity);

                // ===== 触发对话 =====
                if (!this.dialogueManager.isPlaying)
                {
                    this.triggerDialog(npcSprite.entity);
                }

                // ===== 冷却释放 =====
                this.time.delayedCall(800, () => {
                    this.npcDialogCooldown.delete(npcSprite.entity);
                });

            });

        });

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
        this.levelText.setDepth(500);
        this.tipText.setDepth(500);

        // ===== 地图居中偏移 =====
        const padX = this.scale.width / 2;
        const padY = this.scale.height / 2;


        this.cameras.main.startFollow(
            this.player,
            true,
            1,1
        );


        // ===== 交互提示 =====
        this.interactHint = this.add.text(
            0,
            0,
            '按 SPACE 查看',
            {
                fontSize: '18px',
                color: '#ffffff',
                backgroundColor: '#000000'
            }
        );

        this.interactHint.setPadding(6);
        this.interactHint.setDepth(500);
        this.interactHint.setOrigin(0.5);
        this.interactHint.setVisible(false);

        // ===== 调试信息 =====
        console.log(
            'npcs:',
            this.npcManager.getNPCsInMap(this.currentMap)
        );
    }

    update(time, delta)
    {
        this.interactHint.setVisible(false);
        this.dialogueManager.update();

        if (this.dialogueManager.isPlaying || 
            this.dialogueManager.isShowingObjectDialogue)
        {
            return;
        }

        // this.dialogueManager.update();

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
                    'Near Portal:',
                    portal.name
                );
                const targetMap =
                    this.getProperty(
                        portal,
                        'targetMap'
                    );

                // 显示提示
                this.interactHint.setText(
                    `[SPACE] 前往 ${mapDisplayNames[targetMap]}`
                );

                this.interactHint.setPosition(
                    this.player.x,
                    this.player.y - 48
                );

                this.interactHint.setVisible(true);

                // 按下space前往targetMap
                if(Phaser.Input.Keyboard.JustDown(this.spaceKey))
                {
                    const targetPortal = this.getProperty(portal,'targetPortal')
                    this.switchMap(targetMap,targetPortal);
                }
            }
        });

        // ===== 如果正在显示物品对话 =====
        if (this.dialogueManager.isShowingObjectDialogue)
        {
            return;
        }

        // 默认隐藏交互提示
        // this.interactHint.setVisible(false);

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
                console.log(
                    'Near Object:',
                    obj.name
                );
                // 显示交互提示
                this.interactHint.setPosition(
                    this.player.x,
                    this.player.y - 48
                );

                // 显示提示
                this.interactHint.setText(
                    '[SPACE] 查看'
                );
                this.interactHint.setVisible(true);

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

                    if (dialogProp &&
                        !this.dialogueManager.isShowingObjectDialogue &&
                        !this.dialogueManager.objectDialogCooldown
                    )
                    {
                        // this.dialogueManager.start([
                        //     dialogProp.value
                        // ]);
                        this.dialogueManager.showObjectDialogue(obj);
                        return;
                    }
                }
            }
        });

        // ===== NPC移动 =====
        this.npcManager.update(
            {
                player: this.player,
                playerMap: this.currentMap,
                sceneMap: this.currentMap,
                portalRegistry: this.portalRegistry
            },
            delta
        );

        this.refreshNPCSprites();

        this.npcSprites.forEach(
            sprite => sprite.syncFromEntity()
        );
    }

    triggerDialog(npc)
    {
        this.currentDialogNPC = npc;
        
        // 防止重复触发
        this.dialogTriggered = true;

        const npcName = npc.npcName;

        let dialogueKey;

        console.log(
            `Player caught by ${npcName}`
        );

        // ===== 抓捕次数 =====
        this.npcCatchCount[npcName] =
            (this.npcCatchCount[npcName] || 0) + 1;

        const catchCount =
            this.npcCatchCount[npcName];

        // ===== 对话阶段 =====
        if (catchCount === 1)
        {
            dialogueKey = 'firstCatch';
        }
        else
        {
            dialogueKey = 'secondCatch';
        }

        // ===== 读取对话 =====
        const dialogue =
            dialogues[npcName]?.[dialogueKey];

        // 防止没写对话时报错
        if (!dialogue)
        {
            console.warn(
                `Dialogue not found: ${npcName} -> ${dialogueKey}`
            );

            return;
        }

        // ===== 开始对话 =====
        this.dialogueManager.start(
            dialogue
        );
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
        const npc = this.currentDialogNPC;

        if (!npc)
        {
            this.dialogTriggered = false;
            return;
        }

        const npcName = npc.npcName;

        const catchCount =
            this.npcCatchCount[npcName] || 0;

        // ===== 结算逻辑 =====
        if (catchCount >= 2)
        {
            this.nextLevel();
        }

        // ===== 清理状态 =====
        this.dialogTriggered = false;
        this.currentDialogNPC = null;

        console.log('=== DIALOG END ===');
        console.log(this.npcCatchCount);
        console.log('level:', this.level);
    }

    getProperty(obj, propertyName)
    {
        const prop =
            obj.properties?.find(
                p => p.name === propertyName
            );

        return prop ? prop.value : null;
    }

    switchMap(targetMap, targetPortalName)
    {
        this.mapManager.clearCurrentMap();
        this.currentMap = targetMap;
        this.mapManager.loadMap(targetMap);

        const targetPortal =
            this.mapManager.portals.find(
                p => p.name === targetPortalName
            );

        if (targetPortal)
        {
            this.player.setPosition(
                targetPortal.x + targetPortal.width / 2,
                targetPortal.y + targetPortal.height / 2
            );
        }

        let depth = 0;

        Object.values(this.mapManager.layers).forEach(
            layer => layer.setDepth(depth++)
        );

        this.player.setDepth(depth + 1);

        this.refreshNPCSprites();

        this.npcSprites.forEach(
            sprite => sprite.setDepth(depth + 1)
        );
    }

    refreshNPCSprites()
    {
        const entitiesOnMap =
            this.npcManager.getNPCsInMap(
                this.currentMap
            );

        const entityIds =
            new Set(
                entitiesOnMap.map(
                    entity => entity.id
                )
            );

        this.npcSprites =
            this.npcSprites.filter(sprite => {

                if (
                    !entityIds.has(sprite.entity.id)
                    ||
                    sprite.entity.currentMap !== this.currentMap
                )
                {
                    sprite.despawn();
                    return false;
                }

                return true;
            });

        const hasSprite =
            new Set(
                this.npcSprites.map(
                    sprite => sprite.entity.id
                )
            );

        entitiesOnMap.forEach(entity => {

            if (hasSprite.has(entity.id))
            {
                return;
            }

            const sprite =
                new NPCSprite(
                    this,
                    entity,
                    entity.npcName
                );

            this.npcSprites.push(sprite);
        });
    }

    getNPCFromBodies(bodyA, bodyB)
    {
        const npcBody = this.npcs.find(n => n.body === bodyA || n.body === bodyB);
        return npcBody || null;
    }
}