import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import achievements, {
    DEFAULT_COLLECTION_PORTRAIT,
    DEFAULT_COLLECTION_QUOTE,
    getAchievementDisplay
} from '../../data/achievements.js';
import AchievementManager from '../../systems/AchievementManager.js';
import TypewriterText from '../../systems/TypewriterText.js';
import { TYPEWRITER_OPTIONS } from '../../data/typewriterConfig.js';
import {
    playEnterIfNeeded,
    readCurtainEnter,
    readCurtainTurnKey,
    transitionToScene
} from '../../systems/CurtainTransition.js';
import {
    GAME_HEIGHT,
    TOTAL_WIDTH
} from '../layout.js';
import {
    DIALOGUE_BOX_Y,
    DIALOGUE_BOX_CENTER_X_FULL,
    DIALOGUE_TEXT_X_FULL,
    DIALOGUE_TEXT_Y,
    DIALOGUE_TEXT_STYLE,
    applyDialogueLeftPortrait
} from '../../data/dialoguePortraitLayout.js';

const SCALE = 1.5;

const CELL = Math.round(148 * SCALE);
const GAP = Math.round(18 * SCALE);
const COLS = 3;

/** 方框尺寸不变，仅放大格内贴图 */
const ACHIEVEMENT_ICON_SIZE = Math.round(72 * SCALE * 1.4);

const GRID_LEFT = 680;
const GRID_TOP = 130;

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

        this.cameras.main.setBackgroundColor('#1a1a1a');

        this.add.text(
            TOTAL_WIDTH / 2,
            48,
            '成就',
            {
                fontSize: '36px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        this.createPortraitPanel();
        this.createAchievementGrid();

        const backButton =
            this.add.text(
                TOTAL_WIDTH - 32,
                GAME_HEIGHT - 32,
                '返回主菜单',
                {
                    fontSize: '22px',
                    backgroundColor: '#333333',
                    padding: {
                        left: 18,
                        right: 18,
                        top: 10,
                        bottom: 10
                    }
                }
            )
            .setOrigin(1, 1)
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

    createPortraitPanel()
    {
        this.portraitImage =
            this.add.image(
                0,
                0,
                DEFAULT_COLLECTION_PORTRAIT
            );

        applyDialogueLeftPortrait(this.portraitImage, true);
        this.portraitImage.setDepth(180);

        this.dialogueBox =
            this.add.rectangle(
                DIALOGUE_BOX_CENTER_X_FULL,
                DIALOGUE_BOX_Y,
                900,
                180,
                0x000000,
                0.8
            );

        this.dialogueBox.setDepth(200);

        this.quoteText =
            this.add.text(
                DIALOGUE_TEXT_X_FULL,
                DIALOGUE_TEXT_Y,
                DEFAULT_COLLECTION_QUOTE,
                DIALOGUE_TEXT_STYLE
            );

        this.quoteText.setOrigin(0, 0);
        this.quoteText.setDepth(250);

        this.quoteTypewriter =
            new TypewriterText(
                this,
                this.quoteText,
                TYPEWRITER_OPTIONS
            );

        this.dialogueBox.setInteractive({ useHandCursor: true });

        this.dialogueBox.on('pointerup', () =>
        {
            this.skipQuoteTypewriter();
        });

        this.portraitImage.setInteractive({ useHandCursor: true });

        this.portraitImage.on('pointerup', () =>
        {
            this.skipQuoteTypewriter();
        });

        this.quoteTypewriter.start(DEFAULT_COLLECTION_QUOTE);
    }

    createAchievementGrid()
    {
        const gridLeft = GRID_LEFT;
        const gridTop = GRID_TOP;
        const slots = [...achievements];

        this.achievementCells = [];

        slots.forEach((entry, index) =>
        {
            const col = index % COLS;
            const row = Math.floor(index / COLS);
            const x =
                gridLeft
                + col * (CELL + GAP)
                + CELL / 2;
            const y =
                gridTop
                + row * (CELL + GAP)
                + CELL / 2;

            this.createAchievementCell(entry, x, y);
        });
    }

    isAchievementAvailable(achievement)
    {
        return (
            achievement.alwaysAvailable
            ||
            AchievementManager.has(achievement.id)
        );
    }

    createAchievementCell(achievement, x, y)
    {
        const unlocked = this.isAchievementAvailable(achievement);
        const baseColor = 0x2a2a2a;
        const hoverColor = 0x424242;

        const bg =
            this.add.rectangle(
                x,
                y,
                CELL,
                CELL,
                baseColor,
                1
            );

        bg.setStrokeStyle(2, 0x555555, 0.9);
        bg.setInteractive({ useHandCursor: true });

        let icon = null;

        if (
            !unlocked
            &&
            achievement.textureKey
            &&
            this.textures.exists(achievement.textureKey)
        )
        {
            icon =
                this.add.image(
                    x,
                    y - Math.round(10 * SCALE),
                    achievement.textureKey
                );

            icon.setOrigin(0.5);
            this.fitIcon(icon, ACHIEVEMENT_ICON_SIZE);

            icon.setAlpha(0.25);
            icon.setTint(0x888888);
        }
        else if (
            achievement.textureKey
            &&
            this.textures.exists(achievement.textureKey)
        )
        {
            icon =
                this.add.image(
                    x,
                    y - Math.round(10 * SCALE),
                    achievement.textureKey
                );

            icon.setOrigin(0.5);
            this.fitIcon(icon, ACHIEVEMENT_ICON_SIZE);
        }

        const title =
            this.add.text(
                x,
                y + CELL / 2 - Math.round(22 * SCALE),
                achievement.title,
                {
                    fontSize: `${Math.round(18 * SCALE)}px`,
                    color: unlocked ? '#ffffff' : '#777777',
                    align: 'center'
                }
            );

        title.setOrigin(0.5);

        if (!unlocked)
        {
            const lockOverlay =
                this.add.rectangle(
                    x,
                    y,
                    CELL - Math.round(8 * SCALE),
                    CELL - Math.round(8 * SCALE),
                    0x000000,
                    0.45
                );

            lockOverlay.setInteractive({ useHandCursor: true });

            lockOverlay.on('pointerup', () =>
            {
                this.selectAchievement(achievement);
            });

            this.achievementCells.push(lockOverlay);
        }

        bg.on('pointerover', () =>
        {
            bg.setFillStyle(hoverColor, 1);
        });

        bg.on('pointerout', () =>
        {
            bg.setFillStyle(baseColor, 1);
        });

        bg.on('pointerup', () =>
        {
            this.selectAchievement(achievement);
        });

        this.achievementCells.push(
            bg,
            icon,
            title
        );
    }

    selectAchievement(achievement)
    {
        const unlocked = this.isAchievementAvailable(achievement);
        const display =
            getAchievementDisplay(achievement, unlocked);

        if (!this.quoteTypewriter.isComplete)
        {
            this.quoteTypewriter.skip();
        }

        if (this.textures.exists(display.portraitKey))
        {
            this.portraitImage.setTexture(display.portraitKey);
            applyDialogueLeftPortrait(this.portraitImage, true);
        }

        this.quoteTypewriter.start(display.quote);
    }

    skipQuoteTypewriter()
    {
        if (!this.quoteTypewriter.isComplete)
        {
            this.quoteTypewriter.skip();
        }
    }

    fitIcon(image, maxSize)
    {
        const frame = image.frame;

        if (!frame)
        {
            return;
        }

        image.setScale(
            Math.min(
                maxSize / frame.width,
                maxSize / frame.height,
                2.4
            )
        );
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
