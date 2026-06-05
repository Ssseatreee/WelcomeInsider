import Player from '../../gameObjects/Player.js';
import NPCSprite from '../../gameObjects/NPCSprite.js';

import levels from '../../data/levels';
import DialogueManager from '../../systems/DialogueManager';
import dialogues from '../../data/dialogues';
import GameState from '../../systems/GameState.js';
import {
    beginEnterCurtain,
    finishEnterCurtain,
    readCurtainEnter,
    readCurtainTurnKey,
    transitionToScene
} from '../../systems/CurtainTransition.js';

import MapManager from '../../systems/MapManager.js';
import PortalRegistry from '../../systems/PortalRegistry.js';
import MiniMap from '../../systems/MiniMap.js';
import WorkBacklogBar from '../../systems/WorkBacklogBar.js';
import HunterPathing from '../../systems/HunterPathing.js';
import LevelObjectives from '../../systems/LevelObjectives.js';
import MissionPanel from '../../systems/MissionPanel.js';
import ItemInventoryPanel from '../../systems/ItemInventoryPanel.js';
import ItemObtainNotice from '../../systems/ItemObtainNotice.js';
import LevelResultOverlay from '../../systems/LevelResultOverlay.js';
import LevelIntroOverlay from '../../systems/LevelIntroOverlay.js';

import mapDisplayNames from '../../data/mapDisplayNames.js';
import miniMapLayout from '../../data/miniMapLayout.js';
import { createLevelHudVolumeControls } from '../../systems/VolumeSettingsPanel.js';
import npcMap from '../../gameObjects/npcs/npcs.js';
import workBacklogConfig from '../../data/workBacklogConfig.js';
import {
    getWorkZonesFromMap,
    boundsOverlapWorkZones
} from '../../systems/workZones.js';
import AchievementManager from '../../systems/AchievementManager.js';
import AchievementUnlockNotice from '../../systems/AchievementUnlockNotice.js';
import AchievementHud from '../../systems/AchievementHud.js';
import items, { resolveItem } from '../../data/items.js';

import {
    GAME_HEIGHT,
    PLAY_AREA_WIDTH,
    PLAY_AREA_X,
    HUD_WIDTH,
    RIGHT_HUD_X,
    TOTAL_WIDTH
} from '../layout.js';
import { fadeSceneToBlack } from '../../systems/fullScreenFade.js';
import { ENDING_FADE_MS } from '../../data/endingConfig.js';

import * as  Phaser from 'phaser';

export default class LevelScene extends Phaser.Scene
{
    constructor()
    {
        super('LevelScene');
    }

    init(data)
    {
        this.curtainEnter = readCurtainEnter(data);
        this.curtainTurnKey = readCurtainTurnKey(data);
        this._curtainTransitioning = false;
        this._returningToMenu = false;
        this.continueGame = Boolean(data.continueGame);
        this.saveData = null;

        if (this.continueGame)
        {
            this.saveData = GameState.loadSave();

            if (this.saveData)
            {
                this.level = this.saveData.level || 1;
            }
            else
            {
                this.continueGame = false;
                this.level = data.level || 1;
            }
        }
        else
        {
            this.level = data.level || 1;
        }
    }

    create()
    {
        this.input.enabled = true;
        this._curtainTransitioning = false;
        this._returningToMenu = false;

        this.setupPlayAreaCameras();

        this._curtainHandle =
            beginEnterCurtain(this);

        let levelData = levels[this.level];

        if (!levelData)
        {
            this.level = 1;
            this.continueGame = false;
            this.saveData = null;
            levelData = levels[1];
        }

        try
        {
        // ===== 当前关卡数据 =====

        // ===== 玩家 =====
        this.player = new Player(
            this,
            levelData.playerSpawn.x,
            levelData.playerSpawn.y
        );

        const startMap =
            this.continueGame
            &&
            this.saveData?.currentMap
                ? this.saveData.currentMap
                : (
                    levelData.playerSpawn.mapKey
                    ?? 'office'
                );

        // ===== 当前地图 =====
        this.currentMap = startMap;

        this.portalRegistry = new PortalRegistry();

        this.npcCatchCount =
            this.continueGame
            &&
            this.saveData?.npcCatchCount
                ? { ...this.saveData.npcCatchCount }
                : {};
        // ===== NPCManager =====
        this.npcManager =
            this.game.npcManager;

        if (this.level === 5)
        {
            this.resetFinaleNpcFlags();
        }

        this.rebuildNPCsFromLevel(levelData);

        if (this.continueGame && this.saveData)
        {
            this.applySavedNpcs(this.saveData);
        }

        // ===== 当前Scene中的Sprite（只创建一次，切图不销毁）=====
        this.npcSprites =
            this.npcManager.getAllNPCs().map(
                entity =>
                    new NPCSprite(this, entity)
            );

        // ===== 地图管理器 =====
        this.mapManager = new MapManager(this);

        this.mapManager.loadMap(startMap);

        if (this.continueGame && this.saveData)
        {
            this.player.setPosition(
                this.saveData.playerX,
                this.saveData.playerY
            );
        }

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
        this.grantedSecondChance = false;
        this.missionCompleting = false;
        this.isWorking = true;
        this.officeWorkZones =
            getWorkZonesFromMap(this, 'office');
        this.survivalMs =
            this.continueGame
            &&
            this.saveData?.survivalMs
                ? this.saveData.survivalMs
                : 0;
        this.isResultShowing = false;
        this.isEndingStarting = false;
        this.isIntroShowing = false;

        // ===== 关卡任务 =====
        this.levelData = levelData;
        this.objectives =
            new LevelObjectives(levelData.mission);

        this.objectives.syncFromGameState();

        if (levelData.mission)
        {
            this.missionPanel =
                new MissionPanel(
                    this,
                    this.objectives,
                    levelData.mission
                );

            this.missionPanel.refresh(this.survivalMs);
        }

        this.resultOverlay =
            new LevelResultOverlay(this);

        this.introOverlay =
            new LevelIntroOverlay(this);

        // ===== 对话管理器 =====
        this.dialogueManager =
            new DialogueManager(this);


        // ===== 对话冷却 =====
        this.dialogCooldown = 1000;

        this.canTriggerDialog = true;

        // ===== Matter碰撞监听 =====
        this.npcDialogCooldown = new Set();

        /** 追捕对话结束后剩余冷却（毫秒） */
        this.hunterGraceRemaining = 0;

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

                if (
                    (
                        this.hunterGraceRemaining > 0
                        ||
                        this.isWorking
                    )
                    &&
                    npcSprite.entity.type === 'hunter'
                )
                {
                    return;
                }

                // ===== NPC 冷却（关键）=====
                if (this.npcDialogCooldown.has(npcSprite.entity)) return;

                this.npcDialogCooldown.add(npcSprite.entity);

                // ===== 触发对话 =====
                if (
                    !this.isResultShowing
                    &&
                    !this.isIntroShowing
                    &&
                    !this.dialogueManager.isPlaying
                )
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
            '方向键移动 · 完成任务通关',
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

        this.createBackButton();

        // ===== 待处理工作进度条（右侧黑色 HUD 区） =====
        this.workBacklog =
            new WorkBacklogBar(this);

        this.workBacklog.onSpeedBoost =
            () => this.applyHunterSpeedBoost();

        this.workBacklog.onSpeedBoostRevert =
            () => this.revertHunterSpeedBoost();

        this.itemPanel =
            new ItemInventoryPanel(this);

        this.itemObtainNotice =
            new ItemObtainNotice(this);

        this.achievementUnlockNotice =
            new AchievementUnlockNotice(this);

        this.achievementHud =
            new AchievementHud(this);

        this.currentCatchIsBusy = false;

        this.applyCameraFilters();

        // ===== 调试信息 =====
        console.log(
            'npcs:',
            this.npcManager.getNPCsInMap(this.currentMap)
        );

        finishEnterCurtain(
            this,
            this._curtainHandle
        );

        this.game.bgmManager?.playLevel(this);

        this.maybeShowLevelIntro();
        }
        finally
        {
            if (this.input.enabled === false)
            {
                this.input.enabled = true;
            }
        }
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

        if (this.backButton)
        {
            this.cameras.main.ignore(this.backButton);
            this.rightHudCamera?.ignore(this.backButton);
        }

        if (this.settingsButton)
        {
            this.cameras.main.ignore(this.settingsButton);
            this.rightHudCamera?.ignore(this.settingsButton);
        }

        if (this.volumeSettingsPanel?.container)
        {
            this.cameras.main.ignore(
                this.volumeSettingsPanel.container
            );

            this.rightHudCamera?.ignore(
                this.volumeSettingsPanel.container
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

        if (this.missionPanel?.container)
        {
            this.cameras.main.ignore(
                this.missionPanel.container
            );

            this.hudCamera?.ignore(
                this.missionPanel.container
            );
        }

        if (this.itemPanel?.container)
        {
            this.cameras.main.ignore(
                this.itemPanel.container
            );

            this.hudCamera?.ignore(
                this.itemPanel.container
            );
        }

        if (this.itemObtainNotice?.container)
        {
            this.hudCamera?.ignore(
                this.itemObtainNotice.container
            );

            this.rightHudCamera?.ignore(
                this.itemObtainNotice.container
            );
        }

        if (this.achievementUnlockNotice?.container)
        {
            this.hudCamera?.ignore(
                this.achievementUnlockNotice.container
            );

            this.rightHudCamera?.ignore(
                this.achievementUnlockNotice.container
            );
        }

        if (this.achievementHud?.container)
        {
            this.hudCamera?.ignore(
                this.achievementHud.container
            );

            this.rightHudCamera?.ignore(
                this.achievementHud.container
            );
        }

        if (this.resultOverlay?.container)
        {
            this.hudCamera?.ignore(
                this.resultOverlay.container
            );

            this.rightHudCamera?.ignore(
                this.resultOverlay.container
            );
        }

        if (this.introOverlay?.container)
        {
            this.hudCamera?.ignore(
                this.introOverlay.container
            );

            this.rightHudCamera?.ignore(
                this.introOverlay.container
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

            // 物品图标仅在主游戏区居中显示
            this.hudCamera?.ignore(dm.effectImage);
            this.rightHudCamera?.ignore(dm.effectImage);

            dm.choiceTexts?.forEach(text =>
            {
                hudIgnore(text);
                rightHudIgnore(text);
            });

            hudIgnore(dm.choiceHint);
            rightHudIgnore(dm.choiceHint);
        }
    }

    applyNeutralEffect(effect)
    {
        if (effect === 'azeCoffee')
        {
            this.grantAzeCoffee();
        }
        else if (effect === 'clearWork')
        {
            this.clearWorkBacklog();
        }
        else if (effect === 'giveDonutToSply')
        {
            this.grantDonutToSply();
        }
        else if (effect === 'splyRefuse')
        {
            this.applySplyRefuse();
        }

        this.pendingNeutralEffect = null;
    }

    grantDonutToSply()
    {
        if (!GameState.hasCollectedItem('donut'))
        {
            return;
        }

        GameState.removeCollectedItem('donut');
        this.itemPanel?.refresh();

        if (GameState.hasCollectedItem('drone'))
        {
            return;
        }

        GameState.addCollectedItem('drone');

        this.emitObjectiveEvent({
            type: 'collectItem',
            itemId: 'drone'
        });

        this.itemPanel?.refresh();
        this.itemObtainNotice?.show(items.drone);
    }

    applySplyRefuse()
    {
        if (GameState.getFlag('federicoAware'))
        {
            return;
        }

        GameState.setFlag('federicoAware', true);

        this.itemObtainNotice?.showMessage(
            '~费德里科察觉到了你的位置~'
        );
    }

    buildSplyDialogue()
    {
        const talk = dialogues.sply?.talk ?? [];
        const choiceBlock = talk[talk.length - 1];

        if (!choiceBlock?.choices)
        {
            return talk;
        }

        const prefix = talk.slice(0, -1);
        const choices =
            choiceBlock.choices.filter(choice =>
            {
                if (choice.effect === 'giveDonutToSply')
                {
                    return GameState.hasCollectedItem('donut');
                }

                return true;
            });

        return [
            ...prefix,
            { choices }
        ];
    }

    applyBetrayOren()
    {
        GameState.setFlag('orenBetrayed', true);

        const oren =
            this.npcManager.getAllNPCs().find(
                npc =>
                    npc.npcName === 'oren'
                    &&
                    npc.type === 'neutral'
            );

        if (oren)
        {
            oren.removed = true;

            const sprite =
                this.npcSprites.find(
                    s => s.entity === oren
                );

            if (sprite?.scene)
            {
                sprite.setOnMap(false);
            }
        }

        if (this.currentDialogNPC)
        {
            this.npcCatchCount[
                this.currentDialogNPC.npcName
            ] = 0;
        }

        this.grantedSecondChance = true;
        this.pendingNeutralEffect = null;

        this.emitObjectiveEvent({
            type: 'setFlag',
            flag: 'orenBetrayed'
        });
    }

    buildSecondCatchDialogue(npcName)
    {
        const lines =
            dialogues[npcName]?.secondCatch ?? [];

        if (
            !GameState.getFlag('orenMet')
            ||
            GameState.getFlag('orenBetrayed')
        )
        {
            return lines;
        }

        const aboutOren =
            dialogues[npcName]?.aboutOren;

        if (!aboutOren?.length)
        {
            return lines;
        }

        return [
            ...lines,
            {
                choices: [
                    {
                        label: '出卖奥伦，换取一次机会',
                        effect: 'betrayOren',
                        lines: aboutOren
                    },
                    {
                        label: '保持沉默',
                        lines: []
                    }
                ]
            }
        ];
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

    tryUnlockAchievement(achievementId)
    {
        if (!AchievementManager.unlock(achievementId))
        {
            return;
        }

        this.achievementUnlockNotice?.show(achievementId);
        this.achievementHud?.refresh();
    }

    grantAzeCoffee()
    {
        if (GameState.hasCollectedItem('azeCoffee'))
        {
            return;
        }

        GameState.addCollectedItem('azeCoffee');

        this.player.applySpeedBoost(
            items.azeCoffee.speedMultiplier
        );

        this.emitObjectiveEvent({
            type: 'collectItem',
            itemId: 'azeCoffee'
        });

        this.itemPanel?.refresh();
        this.itemObtainNotice?.show(items.azeCoffee);
        this.tryUnlockAchievement('goodSenior');
    }

    tryPickupMapItem(obj)
    {
        const itemKey =
            this.getProperty(obj, 'getItem');

        if (!itemKey)
        {
            return false;
        }

        if (
            GameState.hasPickedMapObject(
                this.currentMap,
                obj.id
            )
        )
        {
            return false;
        }

        const item = resolveItem(itemKey);

        if (!item)
        {
            console.warn(
                'Unknown map item:',
                itemKey
            );

            return false;
        }

        GameState.markMapObjectPicked(
            this.currentMap,
            obj.id
        );

        const isNewItem =
            !GameState.hasCollectedItem(item.id);

        if (isNewItem)
        {
            GameState.addCollectedItem(item.id);

            this.emitObjectiveEvent({
                type: 'collectItem',
                itemId: item.id
            });

            this.itemPanel?.refresh();
            this.itemObtainNotice?.show(item);
        }

        return isNewItem;
    }

    getMapObjectInteractHint(obj)
    {
        if (this.getProperty(obj, 'work'))
        {
            if (this.isWorking)
            {
                return this.getProperty(obj, 'dialog')
                    ? '[SPACE] 工作中 / 查看'
                    : null;
            }

            return '[SPACE] 开始工作';
        }

        const itemKey =
            this.getProperty(obj, 'getItem');

        const hasDialog =
            Boolean(this.getProperty(obj, 'dialog'));

        const canPickup =
            itemKey
            &&
            !GameState.hasPickedMapObject(
                this.currentMap,
                obj.id
            )
            &&
            resolveItem(itemKey);

        if (canPickup && hasDialog)
        {
            const item = resolveItem(itemKey);

            return `[SPACE] 查看 / 拾取 ${item.name}`;
        }

        if (canPickup)
        {
            const item = resolveItem(itemKey);

            return `[SPACE] 拾取 ${item.name}`;
        }

        if (hasDialog)
        {
            return '[SPACE] 查看';
        }

        if (this.getProperty(obj, 'getAchievement'))
        {
            return '[SPACE] 查看';
        }

        return null;
    }

    clearWorkBacklog()
    {
        this.workBacklog?.reset();
        this.revertHunterSpeedBoost();
        GameState.setFlag('workClearedOnce', true);

        this.emitObjectiveEvent({
            type: 'setFlag',
            flag: 'workClearedOnce'
        });
    }

    emitObjectiveEvent(event)
    {
        if (!this.objectives?.onEvent(event))
        {
            return;
        }

        this.missionPanel?.refresh(this.survivalMs);
        this.checkMissionComplete();
    }

    updateSurvival(delta)
    {
        if (this.isWorking)
        {
            return;
        }

        if (!this.objectives?.needsSurvivalTimer())
        {
            return;
        }

        if (this.dialogueManager.isPlaying)
        {
            return;
        }

        if (this.dialogueManager.isShowingObjectDialogue)
        {
            return;
        }

        this.survivalMs += delta;

        if (this.objectives.checkSurvivalTime(this.survivalMs))
        {
            this.missionPanel?.refresh(this.survivalMs);
            this.checkMissionComplete();
            return;
        }

        this.missionPanel?.refresh(this.survivalMs);
    }

    resolveHunterCatchOutcome(npc)
    {
        const mission = this.levelData?.mission;

        if (mission?.passOnCatch)
        {
            this.showLevelResult(
                'pass',
                () => this.advanceLevel()
            );

            return true;
        }

        if (
            npc.npcName === 'oren'
            &&
            npc.type === 'hunter'
        )
        {
            this.failLevel();
            return true;
        }

        if (this.currentCatchIsBusy)
        {
            this.failLevel();
            return true;
        }

        if (this.grantedSecondChance)
        {
            this.grantedSecondChance = false;
            return false;
        }

        const catchCount =
            this.npcCatchCount[npc.npcName] || 0;

        if (catchCount >= 2)
        {
            this.failLevel();
            return true;
        }

        return false;
    }

    checkMissionComplete()
    {
        if (
            this.missionCompleting
            ||
            !this.objectives?.isComplete()
        )
        {
            return;
        }

        this.missionCompleting = true;

        if (
            this.level === 4
            &&
            !GameState.getFlag('orenBetrayed')
        )
        {
            this.tryUnlockAchievement('plantCare');
        }

        this.showLevelResult(
            'pass',
            () => this.advanceLevel()
        );
    }

    maybeShowLevelIntro()
    {
        if (this.continueGame)
        {
            return;
        }

        const intro = this.levelData?.intro;

        if (!intro?.text)
        {
            return;
        }

        this.isIntroShowing = true;

        this.player?.setVelocity(0, 0);

        this.npcSprites?.forEach(sprite =>
        {
            sprite.setVelocity(0, 0);
        });

        this.introOverlay.show(intro, () =>
        {
            this.isIntroShowing = false;
        });
    }

    showLevelResult(type, onConfirm)
    {
        if (this.isResultShowing)
        {
            return;
        }

        this.freezeForResultOverlay();
        this.resultOverlay.show(type, onConfirm);
    }

    freezeForResultOverlay()
    {
        this.isResultShowing = true;

        this.player?.setVelocity(0, 0);

        this.npcManager.getAllNPCs().forEach(npc =>
        {
            npc.vx = 0;
            npc.vy = 0;
        });

        this.npcSprites?.forEach(sprite =>
        {
            sprite.setVelocity(0, 0);
        });
    }

    failLevel()
    {
        if (this.isResultShowing)
        {
            return;
        }

        this.showLevelResult(
            'fail',
            () =>
            {
                this.scene.restart({
                    level: this.level
                });
            }
        );
    }

    advanceLevel()
    {
        if (this.level >= 5)
        {
            this.tryUnlockAchievement('gatherTogether');
            this.startEnding();
            return;
        }

        this.scene.restart({
            level: this.level + 1
        });
    }

    startEnding()
    {
        if (this.isEndingStarting)
        {
            return;
        }

        this.isEndingStarting = true;
        this.input.enabled = false;

        GameState.setFlag('gameComplete', true);

        GameState.saveProgress(
            GameState.buildSaveFromScene(this)
        );

        this.game.bgmManager?.fadeOutForTransition(
            this,
            ENDING_FADE_MS
        );

        fadeSceneToBlack(this, {
            durationMs: ENDING_FADE_MS,
            onComplete: () =>
            {
                this.resultOverlay?.hide();
                this.scene.start('EndingScene');
            }
        });
    }

    despawnNeutralNpc(npc)
    {
        if (npc.npcName === 'aze')
        {
            GameState.setFlag('azeGone', true);
        }
        else if (npc.npcName === 'oren')
        {
            GameState.setFlag('orenMet', true);
            GameState.setFlag('orenGone', true);
        }
        else if (npc.npcName === 'sply')
        {
            GameState.setFlag('splyGone', true);
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
        if (
            Phaser.Input.Keyboard.JustDown(this.escKey)
            &&
            !this.isResultShowing
            &&
            !this.isEndingStarting
            &&
            !this.isIntroShowing
            &&
            !this.dialogueManager.isPlaying
        )
        {
            this.returnToMainMenu();
        }

        if (this.isResultShowing || this.isEndingStarting)
        {
            this.player?.setVelocity(0, 0);
            this.npcSprites?.forEach(sprite =>
            {
                sprite.setVelocity(0, 0);
            });
            return;
        }

        if (this.isIntroShowing)
        {
            this.player?.setVelocity(0, 0);
            this.npcSprites?.forEach(sprite =>
            {
                sprite.setVelocity(0, 0);
            });

            this.introOverlay.update();
            this.miniMap?.update(
                this.currentMap,
                this.player
            );

            return;
        }

        this.interactHint.setVisible(false);
        this.dialogueManager.update();

        // 剧情/抓捕对话：全局暂停
        if (this.dialogueManager.isPlaying)
        {
            this.miniMap?.update(
                this.currentMap,
                this.player
            );

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
                    const hintText =
                        this.getMapObjectInteractHint(obj);

                    if (!hintText)
                    {
                        return;
                    }

                    this.interactHint.setPosition(
                        this.player.x,
                        this.player.y - 48
                    );

                    this.interactHint.setText(hintText);
                    this.interactHint.setVisible(true);

                    if (
                        Phaser.Input.Keyboard.JustDown(
                            this.spaceKey
                        )
                    )
                    {
                        if (this.getProperty(obj, 'work'))
                        {
                            this.isWorking = true;
                        }

                        const achievementId =
                            this.getProperty(
                                obj,
                                'getAchievement'
                            );

                        if (achievementId)
                        {
                            this.tryUnlockAchievement(
                                achievementId
                            );
                        }

                        const gainedNewItem =
                            this.tryPickupMapItem(obj);

                        const dialogProp =
                            obj.properties?.find(
                                p => p.name === 'dialog'
                            );

                        if (
                            dialogProp
                            &&
                            !this.dialogueManager.isShowingObjectDialogue
                            &&
                            !this.dialogueManager.objectDialogCooldown
                        )
                        {
                            const showDialog = () =>
                            {
                                this.dialogueManager.showObjectDialogue(
                                    obj
                                );
                            };

                            if (gainedNewItem)
                            {
                                this.time.delayedCall(
                                    2000,
                                    showDialog
                                );
                            }
                            else
                            {
                                showDialog();
                            }
                        }
                    }
                }
            });
        }

        if (
            !this.dialogueManager.isPlaying
            &&
            !this.dialogueManager.isShowingObjectDialogue
        )
        {
            this.updateWorkingState();
            this.workBacklog?.update(
                delta,
                this.isWorking
            );

            if (!this.isWorking)
            {
                this.updateSurvival(delta);
            }
        }

        // ===== NPC移动 =====
        if (this.hunterGraceRemaining > 0)
        {
            this.hunterGraceRemaining = Math.max(
                0,
                this.hunterGraceRemaining - delta
            );
        }

        this.npcManager.update(
            {
                player: this.player,
                playerMap: this.currentMap,
                sceneMap: this.currentMap,
                portalRegistry: this.portalRegistry,
                hunterGraceActive:
                    this.hunterGraceRemaining > 0,
                hunterGraceRemaining:
                    this.hunterGraceRemaining,
                playerWorking: this.isWorking,
                ensureNavGrid: (mapKey) =>
                {
                    this.mapManager.warmNavigationGrid(
                        mapKey
                    );
                }
            },
            delta
        );

        this.refreshNPCSprites();

        this.npcSprites.forEach(
            sprite => sprite.syncFromEntity()
        );

        this.miniMap?.update(
            this.currentMap,
            this.player
        );
    }

    triggerDialog(npc)
    {
        if (this.isResultShowing || this.isIntroShowing)
        {
            return;
        }

        if (
            (
                this.hunterGraceRemaining > 0
                ||
                this.isWorking
            )
            &&
            npc.type === 'hunter'
        )
        {
            return;
        }

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

            if (
                npc.npcName === 'oren'
                &&
                GameState.getFlag('orenGone')
            )
            {
                this.dialogTriggered = false;
                this.currentDialogNPC = null;
                return;
            }

            if (
                npc.npcName === 'sply'
                &&
                GameState.getFlag('splyGone')
            )
            {
                this.dialogTriggered = false;
                this.currentDialogNPC = null;
                return;
            }

            if (npc.removed)
            {
                this.dialogTriggered = false;
                this.currentDialogNPC = null;
                return;
            }

            dialogueKey = 'talk';

            const dialogue =
                npc.npcName === 'sply'
                    ? this.buildSplyDialogue()
                    : dialogues[npcName]?.[dialogueKey];

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

        // ===== 被出卖的奥伦作为追捕者：一次即过关 =====
        if (
            npcName === 'oren'
            &&
            npc.type === 'hunter'
        )
        {
            const dialogue =
                dialogues.oren?.Catch;

            if (!dialogue)
            {
                console.warn(
                    'Dialogue not found: oren -> Catch'
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

        if (dialogueKey === 'secondCatch')
        {
            dialogue =
                this.buildSecondCatchDialogue(npcName);
        }

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

    shutdown()
    {
        if (this._onCollisionStart)
        {
            this.matter.world.off(
                'collisionstart',
                this._onCollisionStart
            );
        }

        if (this._onHudTopPointerUp)
        {
            this.input.off(
                'pointerup',
                this._onHudTopPointerUp
            );
        }

        this.volumeSettingsPanel?.destroy();

        this.introOverlay?.destroy();

        this.mapManager?.clearCurrentMap();
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

        // ===== 结算逻辑（仅追捕者）=====
        if (npc.type === 'neutral')
        {
            this.despawnNeutralNpc(npc);
        }
        else
        {
            this.resolveHunterCatchOutcome(npc);
            this.startHunterGracePeriod();
        }

        if (npc.type === 'neutral')
        {
            this.emitObjectiveEvent({
                type: 'talkNpc',
                npc: npc.npcName
            });
        }

        // ===== 清理状态 =====
        this.dialogTriggered = false;
        this.currentCatchIsBusy = false;
        this.currentDialogNPC = null;

        console.log('=== DIALOG END ===');
        console.log(this.npcCatchCount);
        console.log('level:', this.level);
    }

    startHunterGracePeriod(durationMs = 5000)
    {
        this.hunterGraceRemaining = durationMs;

        this.npcManager.getAllNPCs().forEach(npc =>
        {
            if (
                npc.type !== 'hunter'
                ||
                npc.removed
                ||
                !npc.pathing
            )
            {
                return;
            }

            npc.pathing.startGraceWander(
                npc.currentMap,
                durationMs
            );
        });
    }

    updateWorkingState()
    {
        const onOffice =
            this.currentMap === 'office';

        if (!onOffice)
        {
            this.isWorking = false;
            return;
        }

        const inWorkZone =
            boundsOverlapWorkZones(
                this.player.getBounds(),
                this.officeWorkZones
            );

        if (!inWorkZone)
        {
            this.isWorking = false;
        }
    }

    getProperty(obj, propertyName)
    {
        const prop =
            obj.properties?.find(
                p => p.name === propertyName
            );

        return prop ? prop.value : null;
    }

    createBackButton()
    {
        const panelTop =
            Math.max(
                8,
                (GAME_HEIGHT - miniMapLayout.panelHeight) / 2
            );

        const hudControls =
            createLevelHudVolumeControls(this, {
                panelTop,
                panelWidth: miniMapLayout.panelWidth,
                panelLeft: miniMapLayout.panelOffsetLeft ?? 0
            });

        this.backButton = hudControls.backButton;
        this.settingsButton = hudControls.settingsButton;
        this.volumeSettingsPanel = hudControls.volumePanel;

        this.backButton.on('pointerup', () =>
        {
            this.returnToMainMenu();
        });

        // 多相机时 Text 的 hitTest 可能失效，用 HUD 区点击作兜底
        this._onHudTopPointerUp = (pointer) =>
        {
            if (pointer.x > HUD_WIDTH)
            {
                return;
            }

            const backBounds =
                this.backButton.getBounds();

            if (backBounds.contains(pointer.x, pointer.y))
            {
                this.returnToMainMenu();
                return;
            }

            const settingsBounds =
                this.settingsButton.getBounds();

            if (settingsBounds.contains(pointer.x, pointer.y))
            {
                this.volumeSettingsPanel.toggle();
            }
        };

        this.input.on(
            'pointerup',
            this._onHudTopPointerUp
        );

        if (this.input.keyboard)
        {
            this.escKey =
                this.input.keyboard.addKey(
                    Phaser.Input.Keyboard.KeyCodes.ESC
                );
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

        GameState.saveProgress(
            GameState.buildSaveFromScene(this)
        );

        transitionToScene(this, 'MainMenuScene');
    }

    applySavedNpcs(saveData)
    {
        if (!saveData?.npcs?.length)
        {
            return;
        }

        for (const saved of saveData.npcs)
        {
            const npc =
                this.npcManager.getNPC(saved.id);

            if (!npc)
            {
                continue;
            }

            if (saved.currentMap != null)
            {
                npc.currentMap = saved.currentMap;
            }

            if (saved.worldX != null)
            {
                npc.worldX = saved.worldX;
            }

            if (saved.worldY != null)
            {
                npc.worldY = saved.worldY;
            }

            if (saved.facing != null)
            {
                npc.facing = saved.facing;
            }

            if (saved.removed != null)
            {
                npc.removed = saved.removed;
            }

            if (
                saved.type === 'hunter'
                &&
                npc.type !== 'hunter'
                &&
                npc.convertToHunter
            )
            {
                npc.convertToHunter();
            }
            else if (saved.type != null)
            {
                npc.type = saved.type;
            }

            if (saved.hasEmpathy != null)
            {
                npc.hasEmpathy = saved.hasEmpathy;
            }

            HunterPathing.clampEntity(
                npc,
                npc.currentMap
            );

            npc.pathing?.reset();

            if (npc.resetWander)
            {
                npc.resetWander();
            }
        }
    }

    resetFinaleNpcFlags()
    {
        GameState.setFlag('azeGone', false);
        GameState.setFlag('orenGone', false);
        GameState.setFlag('splyGone', false);
        GameState.setFlag('orenBetrayed', false);
    }

    rebuildNPCsFromLevel(levelData)
    {
        this.npcManager.clear();

        const applyGoneFlags = this.level < 5;

        levelData.npcs.forEach((npcData, index) =>
        {
            const NPCClass = npcMap[npcData.name];

            if (!NPCClass)
            {
                console.warn(
                    `NPC class not found: ${npcData.name}`
                );

                return;
            }

            const npc = new NPCClass({
                id: `npc_${index}`,
                name: npcData.name,
                x: npcData.x,
                y: npcData.y,
                mapKey: npcData.mapKey,
                type: npcData.type,
                moveSpeed: npcData.moveSpeed,
                hasEmpathy: npcData.hasEmpathy
            });

            if (npcData.type != null)
            {
                npc.type = npcData.type;
            }

            if (npcData.hasEmpathy != null)
            {
                npc.hasEmpathy = npcData.hasEmpathy;
            }

            if (npc.npcName === 'sply')
            {
                npc.wanderMapKey = npc.currentMap;
            }

            HunterPathing.clampEntity(
                npc,
                npc.currentMap
            );

            npc._speedBoosted = false;
            npc.vx = 0;
            npc.vy = 0;
            npc.facing = 'down';
            npc.portalCooldown = 0;
            npc.pathing?.reset();

            if (
                applyGoneFlags
                &&
                npc.npcName === 'aze'
                &&
                GameState.getFlag('azeGone')
            )
            {
                npc.removed = true;
            }
            else if (
                applyGoneFlags
                &&
                npc.npcName === 'oren'
            )
            {
                if (GameState.getFlag('orenBetrayed'))
                {
                    if (npc.convertToHunter)
                    {
                        npc.convertToHunter();
                    }

                    npc.removed = false;
                }
                else if (GameState.getFlag('orenGone'))
                {
                    npc.removed = true;
                }
                else
                {
                    npc.type = 'neutral';
                    npc.hasEmpathy = false;
                    npc.removed = false;
                }
            }
            else if (
                applyGoneFlags
                &&
                npc.npcName === 'sply'
                &&
                GameState.getFlag('splyGone')
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

            this.npcManager.register(npc);
        });

        this.workBacklog?.reset();
    }

    switchMap(targetMap, targetPortalName)
    {
        this.currentMap = targetMap;

        this.npcManager.clampNPCsOnMap(targetMap);

        // 离屏地图 Matter 已卸载，预热导航网格并校正游荡 NPC 位置
        this.npcManager.getAllNPCs().forEach(npc =>
        {
            if (
                npc.removed
                ||
                npc.currentMap === targetMap
            )
            {
                return;
            }

            this.mapManager.warmNavigationGrid(
                npc.currentMap
            );

            HunterPathing.clampEntity(
                npc,
                npc.currentMap
            );
        });

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

        this.emitObjectiveEvent({
            type: 'visitMap',
            mapKey: targetMap
        });

        if (targetMap === 'toilet')
        {
            this.tryUnlockAchievement('accidentZone');
        }

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
                ||
                (
                    sprite.entity.npcName === 'oren'
                    &&
                    GameState.getFlag('orenGone')
                    &&
                    sprite.entity.type === 'neutral'
                )
                ||
                (
                    sprite.entity.npcName === 'sply'
                    &&
                    GameState.getFlag('splyGone')
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