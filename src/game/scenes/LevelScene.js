import Player from '../../gameObjects/Player.js';
import NPCSprite from '../../gameObjects/NPCSprite.js';

import levels from '../../data/levels';
import DialogueManager from '../../systems/DialogueManager';
import dialogues from '../../data/dialogues';
import GameState from '../../systems/GameState.js';

import MapManager from '../../systems/MapManager.js';
import PortalRegistry from '../../systems/PortalRegistry.js';
import MiniMap from '../../systems/MiniMap.js';
import WorkBacklogBar from '../../systems/WorkBacklogBar.js';
import HunterPathing from '../../systems/HunterPathing.js';

import mapDisplayNames from '../../data/mapDisplayNames.js';
import workBacklogConfig from '../../data/workBacklogConfig.js';
import items from '../../data/items.js';

import {
    GAME_HEIGHT,
    PLAY_AREA_WIDTH,
    PLAY_AREA_X,
    HUD_WIDTH,
    RIGHT_HUD_X
} from '../layout.js';

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
        this.setupPlayAreaCameras();

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

        this.resetNPCsFromLevel(levelData);

        // ===== 当前Scene中的Sprite（只创建一次，切图不销毁）=====
        this.npcSprites =
            this.npcManager.getAllNPCs().map(
                entity =>
                    new NPCSprite(this, entity)
            );

        // ===== 地图管理器 =====
        this.mapManager = new MapManager(this);

        this.mapManager.loadMap('drinkingroom');

        const npcMapKeys =
            new Set(
                levelData.npcs
                    .map(npc => npc.mapKey)
                    .filter(Boolean)
            );

        npcMapKeys.forEach(mapKey =>
        {
            this.mapManager.warmNavigationGrid(mapKey);
        });

        this.refreshNPCSprites();

        const depth = this.applyMapLayerDepths();

        this.player.setDepth(depth + 1);

        this.npcSprites.forEach(sprite =>
        {
            sprite.setDepth(depth + 1);
        });

        // ===== 玩家物理参数 =====
        this.player.setFixedRotation();

        this.player.setFrictionAir(0.15);

        if (GameState.hasCollectedItem('azeCoffee'))
        {
            this.player.applySpeedBoost(
                items.azeCoffee.speedMultiplier
            );
        }

        this.pendingNeutralEffect = null;

        // ===== 对话管理器 =====
        this.dialogueManager =
            new DialogueManager(this);


        // ===== 对话冷却 =====
        this.dialogCooldown = 1000;

        this.canTriggerDialog = true;

        // ===== Matter碰撞监听 =====
        this.npcDialogCooldown = new Set();

        this._onCollisionStart = (event) => {

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

        };

        this.matter.world.on(
            'collisionstart',
            this._onCollisionStart
        );

        // ===== 空格键 =====
        this.spaceKey =
            this.input.keyboard.addKey(
                Phaser.Input.Keyboard.KeyCodes.SPACE
            );

        // ===== UI（位于右侧游戏区） =====
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

        // ===== 小地图（左侧黑色 HUD 区） =====
        this.miniMap =
            new MiniMap(
                this,
                this.npcManager
            );

        // ===== 待处理工作进度条（右侧黑色 HUD 区） =====
        this.workBacklog =
            new WorkBacklogBar(this);

        this.workBacklog.onSpeedBoost =
            () => this.applyHunterSpeedBoost();

        this.currentCatchIsBusy = false;

        this.applyCameraFilters();

        // ===== 调试信息 =====
        console.log(
            'npcs:',
            this.npcManager.getNPCsInMap(this.currentMap)
        );
    }

    setupPlayAreaCameras()
    {
        this.hudCamera =
            this.cameras.add(
                0,
                0,
                HUD_WIDTH,
                GAME_HEIGHT
            );

        this.hudCamera.setScroll(0, 0);
        this.hudCamera.setBackgroundColor('#000000');

        this.cameras.main.setViewport(
            PLAY_AREA_X,
            0,
            PLAY_AREA_WIDTH,
            GAME_HEIGHT
        );

        this.cameras.main.setBackgroundColor('#2d2d2d');

        this.rightHudCamera =
            this.cameras.add(
                RIGHT_HUD_X,
                0,
                HUD_WIDTH,
                GAME_HEIGHT
            );

        this.rightHudCamera.setScroll(0, 0);
        this.rightHudCamera.setBackgroundColor('#000000');
    }

    applyCameraFilters()
    {
        if (this.miniMap?.container)
        {
            this.cameras.main.ignore(
                this.miniMap.container
            );

            this.rightHudCamera?.ignore(
                this.miniMap.container
            );
        }

        if (this.workBacklog?.container)
        {
            this.cameras.main.ignore(
                this.workBacklog.container
            );

            this.hudCamera?.ignore(
                this.workBacklog.container
            );
        }

        const hudIgnore = (obj) =>
        {
            if (obj)
            {
                this.hudCamera.ignore(obj);
            }
        };

        const rightHudIgnore = (obj) =>
        {
            if (obj)
            {
                this.rightHudCamera?.ignore(obj);
            }
        };

        hudIgnore(this.player);
        rightHudIgnore(this.player);

        this.npcSprites?.forEach(sprite =>
        {
            hudIgnore(sprite);
            rightHudIgnore(sprite);
        });

        hudIgnore(this.levelText);
        hudIgnore(this.tipText);
        hudIgnore(this.interactHint);

        rightHudIgnore(this.levelText);
        rightHudIgnore(this.tipText);
        rightHudIgnore(this.interactHint);

        Object.values(
            this.mapManager?.layers ?? {}
        ).forEach(layer =>
        {
            hudIgnore(layer);
            rightHudIgnore(layer);
        });

        const debugGraphic =
            this.matter.world.debugGraphic;

        if (debugGraphic)
        {
            this.hudCamera.ignore(debugGraphic);
            this.rightHudCamera?.ignore(debugGraphic);
        }

        const dm = this.dialogueManager;

        if (dm)
        {
            hudIgnore(dm.box);
            hudIgnore(dm.text);
            hudIgnore(dm.objectDialogText);
            hudIgnore(dm.leftPortrait);
            hudIgnore(dm.rightPortrait);

            rightHudIgnore(dm.box);
            rightHudIgnore(dm.text);
            rightHudIgnore(dm.objectDialogText);
            rightHudIgnore(dm.leftPortrait);
            rightHudIgnore(dm.rightPortrait);

            dm.choiceTexts?.forEach(text =>
            {
                hudIgnore(text);
                rightHudIgnore(text);
            });

            hudIgnore(dm.choiceHint);
            rightHudIgnore(dm.choiceHint);
        }
    }

    revertHunterSpeedBoost()
    {
        this.npcManager.getAllNPCs().forEach(npc =>
        {
            if (
                npc.type !== 'hunter'
                ||
                !npc._speedBoosted
            )
            {
                return;
            }

            npc.moveSpeed = npc.baseMoveSpeed;
            npc._speedBoosted = false;
        });
    }

    grantAzeCoffee()
    {
        GameState.addCollectedItem('azeCoffee');

        this.player.applySpeedBoost(
            items.azeCoffee.speedMultiplier
        );
    }

    clearWorkBacklog()
    {
        this.workBacklog?.reset();
        this.revertHunterSpeedBoost();
    }

    despawnNeutralNpc(npc)
    {
        if (npc.npcName === 'aze')
        {
            GameState.setFlag('azeGone', true);
        }

        npc.removed = true;

        const sprite =
            this.npcSprites.find(
                s => s.entity === npc
            );

        if (sprite?.scene)
        {
            sprite.setOnMap(false);
        }
    }

    applyHunterSpeedBoost()
    {
        this.npcManager.getAllNPCs().forEach(npc =>
        {
            if (npc.type !== 'hunter' || npc._speedBoosted)
            {
                return;
            }

            npc.baseMoveSpeed =
                npc.baseMoveSpeed ?? npc.moveSpeed;

            npc.moveSpeed =
                npc.baseMoveSpeed
                * workBacklogConfig.speedBoostMultiplier;

            npc._speedBoosted = true;
        });
    }

    update(time, delta)
    {
        this.interactHint.setVisible(false);
        this.dialogueManager.update();

        this.miniMap?.update(
            this.currentMap,
            this.player
        );

        // NPC 对话期间不累积待处理工作
        if (!this.dialogueManager.isPlaying)
        {
            this.workBacklog?.update(delta);
        }

        // 剧情/抓捕对话：全局暂停
        if (this.dialogueManager.isPlaying)
        {
            return;
        }

        // 物品介绍：玩家不可操作，但 NPC 仍可移动
        if (!this.dialogueManager.isShowingObjectDialogue)
        {
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
                            this.dialogueManager.showObjectDialogue(obj);
                            return;
                        }
                    }
                }
            });
        }

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
            `Player collided with ${npcName}`
        );

        if (npc.type === 'neutral')
        {
            if (
                npc.npcName === 'aze'
                &&
                GameState.getFlag('azeGone')
            )
            {
                this.dialogTriggered = false;
                this.currentDialogNPC = null;
                return;
            }

            dialogueKey = 'talk';

            const dialogue =
                dialogues[npcName]?.[dialogueKey];

            if (!dialogue)
            {
                console.warn(
                    `Dialogue not found: ${npcName} -> ${dialogueKey}`
                );
                this.dialogTriggered = false;
                this.currentDialogNPC = null;
                return;
            }

            this.currentCatchIsBusy = false;
            this.dialogueManager.start(dialogue);
            return;
        }

        const isBusy =
            this.workBacklog?.isFull() ?? false;

        this.currentCatchIsBusy = isBusy;

        if (isBusy)
        {
            dialogueKey = 'busyCatch';
        }
        else
        {
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
        }

        // ===== 读取对话 =====
        let dialogue =
            dialogues[npcName]?.[dialogueKey];

        if (!dialogue && isBusy)
        {
            dialogue =
                dialogues[npcName]?.secondCatch;
        }

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

        const nextLevel = this.level + 1;

        // 避免在 update / 对话回调中同步 restart 导致场景状态异常
        this.time.delayedCall(0, () =>
        {
            this.scene.restart({
                level: nextLevel
            });
        });
    }

    shutdown()
    {
        if (this._onCollisionStart)
        {
            this.matter.world.off(
                'collisionstart',
                this._onCollisionStart
            );
        }
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

        // ===== 结算逻辑（仅追捕者）=====
        if (npc.type === 'neutral')
        {
            const effect = this.pendingNeutralEffect;

            this.pendingNeutralEffect = null;

            if (effect === 'azeCoffee')
            {
                this.grantAzeCoffee();
            }
            else if (effect === 'clearWork')
            {
                this.clearWorkBacklog();
            }

            this.despawnNeutralNpc(npc);
        }
        else
        {
            if (this.currentCatchIsBusy)
            {
                this.nextLevel();
            }
            else if (catchCount >= 2)
            {
                this.nextLevel();
            }
        }

        // ===== 清理状态 =====
        this.dialogTriggered = false;
        this.currentCatchIsBusy = false;
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

    resetNPCsFromLevel(levelData)
    {
        levelData.npcs.forEach((npcData, index) =>
        {
            const npc =
                this.npcManager.getNPC(
                    `npc_${index}`
                );

            if (!npc)
            {
                return;
            }

            if (npcData.mapKey != null)
            {
                npc.currentMap = npcData.mapKey;
            }

            if (npcData.x != null)
            {
                npc.worldX = npcData.x;
            }

            if (npcData.y != null)
            {
                npc.worldY = npcData.y;
            }

            HunterPathing.clampEntity(
                npc,
                npc.currentMap
            );

            if (npcData.moveSpeed != null)
            {
                npc.moveSpeed = npcData.moveSpeed;
                npc.baseMoveSpeed = npcData.moveSpeed;
            }

            npc._speedBoosted = false;
            npc.vx = 0;
            npc.vy = 0;
            npc.facing = 'down';
            npc.portalCooldown = 0;
            npc.pathing?.reset();

            if (
                npc.npcName === 'aze'
                &&
                GameState.getFlag('azeGone')
            )
            {
                npc.removed = true;
            }
            else
            {
                npc.removed = false;
            }

            if (npc.resetWander)
            {
                npc.resetWander();
            }
        });

        this.workBacklog?.reset();
    }

    switchMap(targetMap, targetPortalName)
    {
        this.currentMap = targetMap;

        // 先更新 NPC 可见性/物理体，再卸载旧地图，避免残留碰撞体
        this.refreshNPCSprites();

        this.mapManager.clearCurrentMap();
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

        const depth = this.applyMapLayerDepths();

        this.player.setDepth(depth + 1);

        this.refreshNPCSprites();

        this.npcSprites.forEach(sprite =>
        {
            sprite.setDepth(depth + 1);
        });

        this.applyCameraFilters();

        console.log(
            'npcs:',
            this.npcManager.getNPCsInMap(this.currentMap)
        );
    }

    applyMapLayerDepths()
    {
        let depth = 0;

        Object.values(this.mapManager.layers).forEach(layer =>
        {
            if (layer.name === 'border')
            {
                return;
            }

            layer.setDepth(depth);
            depth += 1;
        });

        if (this.mapManager.topLayer)
        {
            this.mapManager.topLayer.forEach(
                layer => layer.setDepth(depth + 10)
            );
        }

        if (this.mapManager.layers['border'])
        {
            this.mapManager.layers['border'].setDepth(
                depth + 10
            );
        }

        return depth;
    }

    refreshNPCSprites()
    {
        this.npcSprites.forEach(sprite =>
        {
            if (
                sprite.entity.removed
                ||
                (
                    sprite.entity.npcName === 'aze'
                    &&
                    GameState.getFlag('azeGone')
                )
            )
            {
                sprite.setOnMap(false);
                return;
            }

            const onMap =
                sprite.entity.currentMap === this.currentMap;

            sprite.setOnMap(onMap);
        });
    }

    getNPCFromBodies(bodyA, bodyB)
    {
        const npcBody = this.npcs.find(n => n.body === bodyA || n.body === bodyB);
        return npcBody || null;
    }
}