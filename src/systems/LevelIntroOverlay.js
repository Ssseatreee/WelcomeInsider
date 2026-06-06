import * as Phaser from 'phaser';
import TypewriterText from './TypewriterText.js';
import { INTRO_TYPEWRITER_OPTIONS } from '../data/typewriterConfig.js';
import {
    withButtonTextStyle,
    withTextPadding
} from '../data/textStyle.js';
import {
    GAME_HEIGHT,
    PLAY_AREA_UI_CENTER_X
} from '../game/layout.js';

/**
 * @param {string | { npc?: string, name?: string, expression?: string, textureKey?: string }} portrait
 * @returns {string | null}
 */
export function resolvePortraitKey(portrait)
{
    if (!portrait)
    {
        return null;
    }

    if (typeof portrait === 'string')
    {
        return portrait;
    }

    if (portrait.textureKey)
    {
        return portrait.textureKey;
    }

    const npc = portrait.npc ?? portrait.name;
    const expression = portrait.expression ?? 'normal';

    if (!npc)
    {
        return null;
    }

    return `portrait-${npc}-${expression}`;
}

export default class LevelIntroOverlay
{
    constructor(scene)
    {
        this.scene = scene;
        this.onConfirm = null;

        this.centerX = PLAY_AREA_UI_CENTER_X;
        this.centerY = GAME_HEIGHT / 2;

        this.boxWidth = 560;
        this.boxHeight = 300;
        this.portraitAreaWidth = 190;

        this.build();
        this.hide();
    }

    build()
    {
        this.container =
            this.scene.add.container(0, 0);

        this.container.setScrollFactor(0);
        this.container.setDepth(1990);

        this.backdrop =
            this.scene.add.rectangle(
                this.centerX,
                this.centerY,
                4096,
                GAME_HEIGHT,
                0x000000,
                0.45
            );

        this.backdrop.setScrollFactor(0);
        this.container.add(this.backdrop);

        const boxLeft =
            this.centerX - this.boxWidth / 2;

        const boxTop =
            this.centerY - this.boxHeight / 2;

        this.box =
            this.scene.add.rectangle(
                this.centerX,
                this.centerY,
                this.boxWidth,
                this.boxHeight,
                0xffffff,
                1
            );

        this.box.setStrokeStyle(2, 0xdddddd);
        this.box.setScrollFactor(0);
        this.box.setInteractive({ useHandCursor: true });

        this.box.on('pointerdown', () =>
        {
            if (!this.bodyTypewriter.isComplete)
            {
                this.bodyTypewriter.skip();
            }
        });

        this.container.add(this.box);

        this.portraitContainer =
            this.scene.add.container(
                boxLeft + this.portraitAreaWidth / 2,
                this.centerY
            );

        this.portraitContainer.setScrollFactor(0);

        this.portrait =
            this.scene.add.image(0, 0, 'portrait-v2-normal');

        this.portrait.setOrigin(0.5);
        this.portrait.setTint(0x000000);

        this.portraitContainer.add(this.portrait);

        this.container.add(this.portraitContainer);

        this.titleText =
            this.scene.add.text(
                this.centerX,
                boxTop + 28,
                '',
                withTextPadding({
                    fontSize: '26px',
                    color: '#222222',
                    fontStyle: 'bold'
                })
            );

        this.titleText.setOrigin(0.5, 0);
        this.titleText.setScrollFactor(0);
        this.container.add(this.titleText);

        this.bodyText =
            this.scene.add.text(
                boxLeft + this.portraitAreaWidth + 16,
                boxTop + 68,
                '',
                withTextPadding({
                    fontSize: '16px',
                    color: '#333333',
                    wordWrap: {
                        width:
                            this.boxWidth
                            - this.portraitAreaWidth
                            - 32,
                        useAdvancedWrap: true
                    },
                    lineSpacing: 10
                })
            );

        this.bodyText.setScrollFactor(0);
        this.container.add(this.bodyText);

        this.button =
            this.scene.add.text(
                this.centerX + this.portraitAreaWidth / 4,
                boxTop + this.boxHeight - 44,
                '开始',
                withButtonTextStyle({
                    fontSize: '22px',
                    color: '#ffffff',
                    backgroundColor: '#333333',
                    padding: {
                        left: 22,
                        right: 22,
                        top: 14,
                        bottom: 12
                    }
                })
            );

        this.button.setOrigin(0.5);
        this.button.setScrollFactor(0);
        this.button.setInteractive({ useHandCursor: true });
        this.container.add(this.button);

        this.button.on('pointerover', () =>
        {
            this.button.setStyle({
                backgroundColor: '#555555'
            });
        });

        this.button.on('pointerout', () =>
        {
            this.button.setStyle({
                backgroundColor: '#333333'
            });
        });

        this.button.on('pointerdown', () =>
        {
            this.tryConfirm();
        });

        this.confirmKey =
            this.scene.input.keyboard?.addKey(
                Phaser.Input.Keyboard.KeyCodes.SPACE
            );

        this.confirmKeyAlt =
            this.scene.input.keyboard?.addKey(
                Phaser.Input.Keyboard.KeyCodes.ENTER
            );

        this.bodyTypewriter =
            new TypewriterText(
                this.scene,
                this.bodyText,
                INTRO_TYPEWRITER_OPTIONS
            );
    }

    fitPortrait(textureKey)
    {
        const frame =
            this.scene.textures.getFrame(textureKey);

        const maxWidth = this.portraitAreaWidth - 12;
        const maxHeight = this.boxHeight - 24;

        const scale = Math.min(
            maxWidth / frame.width,
            maxHeight / frame.height,
            1
        );

        this.portrait.setTexture(textureKey);
        this.portrait.setScale(scale);
        this.portrait.setTint(0x000000);
        this.portrait.setVisible(true);
    }

    /**
     * @param {{ portrait?: object, text?: string, title?: string }} intro
     * @param {() => void} [onConfirm]
     */
    show(intro, onConfirm)
    {
        this.onConfirm = onConfirm ?? null;

        const textureKey =
            resolvePortraitKey(intro?.portrait);

        if (
            textureKey
            &&
            this.scene.textures.exists(textureKey)
        )
        {
            this.fitPortrait(textureKey);
            this.portraitContainer.setVisible(true);
        }
        else
        {
            this.portraitContainer.setVisible(false);
        }

        const title = intro?.title ?? '';

        this.titleText.setText(title);
        this.titleText.setVisible(Boolean(title));

        this.container.setVisible(true);

        this.bodyTypewriter.start(intro?.text ?? '');
    }

    tryConfirm()
    {
        if (!this.bodyTypewriter.isComplete)
        {
            this.bodyTypewriter.skip();
            return;
        }

        this.confirm();
    }

    hide()
    {
        this.bodyTypewriter.stop();
        this.container.setVisible(false);
        this.onConfirm = null;
    }

    confirm()
    {
        if (!this.container.visible)
        {
            return;
        }

        const callback = this.onConfirm;

        this.hide();
        callback?.();
    }

    update()
    {
        if (!this.container.visible)
        {
            return;
        }

        if (
            Phaser.Input.Keyboard.JustDown(this.confirmKey)
            ||
            Phaser.Input.Keyboard.JustDown(this.confirmKeyAlt)
        )
        {
            this.tryConfirm();
        }
    }

    destroy()
    {
        this.bodyTypewriter.stop();
        this.container?.destroy(true);
    }
}
