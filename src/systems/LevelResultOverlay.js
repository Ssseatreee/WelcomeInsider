import * as Phaser from 'phaser';
import {
    GAME_HEIGHT,
    PLAY_AREA_UI_CENTER_X,
    PLAY_AREA_WIDTH
} from '../game/layout.js';

const OUTLINE_DIRS = [
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -0.707, y: -0.707 },
    { x: 0.707, y: -0.707 },
    { x: -0.707, y: 0.707 },
    { x: 0.707, y: 0.707 }
];

const OUTLINE_PIXEL = 1.5;
const OUTLINE_WOBBLE_RANGE = 6;
const OUTLINE_JUMP_MIN_DELAY = 1000;
const OUTLINE_JUMP_MAX_DELAY = 1800;
const OUTLINE_COLOR = 0x000000;

export default class LevelResultOverlay
{
    constructor(scene)
    {
        this.scene = scene;
        this.onConfirm = null;

        this.centerX = PLAY_AREA_UI_CENTER_X;
        this.centerY = GAME_HEIGHT / 2;

        this.boxWidth = 520;
        this.boxHeight = 460;

        this.workDotsTimer = null;
        this.workDotIndex = 0;
        this.outlineWobbleActive = false;

        this.build();
        this.hide();
    }

    build()
    {
        this.container =
            this.scene.add.container(0, 0);

        this.container.setScrollFactor(0);
        this.container.setDepth(2000);

        this.backdrop =
            this.scene.add.rectangle(
                this.centerX,
                this.centerY,
                PLAY_AREA_WIDTH,
                GAME_HEIGHT,
                0x000000,
                0.55
            );

        this.backdrop.setScrollFactor(0);
        this.container.add(this.backdrop);

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
        this.container.add(this.box);

        const boxTop =
            this.centerY - this.boxHeight / 2;

        this.headlineText =
            this.scene.add.text(
                this.centerX,
                boxTop + 34,
                '',
                {
                    fontSize: '34px',
                    color: '#222222',
                    fontStyle: 'bold'
                }
            );

        this.headlineText.setOrigin(0.5);
        this.headlineText.setScrollFactor(0);
        this.container.add(this.headlineText);

        this.portraitY = this.centerY + 24;

        this.portraitOutlineContainer =
            this.scene.add.container(
                this.centerX,
                this.portraitY
            );

        this.portraitOutlineContainer.setScrollFactor(0);

        this.outlineSprites =
            OUTLINE_DIRS.map((dir) =>
            {
                const sprite =
                    this.scene.add.image(0, 0, 'level-pass-portrait');

                sprite.setOrigin(0.5);
                sprite.setTint(OUTLINE_COLOR);
                sprite.dir = dir;
                sprite.wobble = { x: 0, y: 0 };
                sprite.jumpDelay = null;
                this.portraitOutlineContainer.add(sprite);

                return sprite;
            });

        this.container.add(this.portraitOutlineContainer);

        this.portrait =
            this.scene.add.image(
                this.centerX,
                this.portraitY,
                'level-pass-portrait'
            );

        this.portrait.setScrollFactor(0);
        this.container.add(this.portrait);

        this.button =
            this.scene.add.text(
                this.centerX,
                boxTop + this.boxHeight - 44,
                '',
                {
                    fontSize: '24px',
                    color: '#ffffff',
                    backgroundColor: '#333333',
                    padding: {
                        left: 20,
                        right: 20,
                        top: 10,
                        bottom: 10
                    }
                }
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
            if (!this.container.visible)
            {
                return;
            }

            const callback = this.onConfirm;

            this.hide();
            callback?.();
        });
    }

    fitPortrait(textureKey)
    {
        const frame =
            this.scene.textures.getFrame(textureKey);

        const maxWidth = this.boxWidth - 56;
        const maxHeight = this.boxHeight - 200;

        const scale = Math.min(
            maxWidth / frame.width,
            maxHeight / frame.height,
            1
        );

        this.portrait.setTexture(textureKey);
        this.portrait.setScale(scale);
        this.syncPortraitOutline(textureKey, scale);
    }

    syncPortraitOutline(textureKey, scale = this.portrait.scaleX)
    {
        this.outlineSprites.forEach((sprite) =>
        {
            sprite.setTexture(textureKey);
            sprite.setScale(scale);
            sprite.x =
                sprite.dir.x * OUTLINE_PIXEL +
                sprite.wobble.x;
            sprite.y =
                sprite.dir.y * OUTLINE_PIXEL +
                sprite.wobble.y;
        });
    }

    resetOutlineWobble()
    {
        this.outlineSprites.forEach((sprite) =>
        {
            sprite.wobble.x = 0;
            sprite.wobble.y = 0;
        });

        this.syncPortraitOutline(this.portrait.texture.key);
    }

    queueOutlineSpriteJump(sprite)
    {
        if (!this.outlineWobbleActive)
        {
            return;
        }

        if (sprite.jumpDelay)
        {
            sprite.jumpDelay.remove();
            sprite.jumpDelay = null;
        }

        sprite.wobble.x =
            Phaser.Math.FloatBetween(
                -OUTLINE_WOBBLE_RANGE,
                OUTLINE_WOBBLE_RANGE
            );

        sprite.wobble.y =
            Phaser.Math.FloatBetween(
                -OUTLINE_WOBBLE_RANGE,
                OUTLINE_WOBBLE_RANGE
            );

        this.syncPortraitOutline(this.portrait.texture.key);

        sprite.jumpDelay =
            this.scene.time.delayedCall(
                Phaser.Math.Between(
                    OUTLINE_JUMP_MIN_DELAY,
                    OUTLINE_JUMP_MAX_DELAY
                ),
                () =>
                {
                    sprite.jumpDelay = null;
                    this.queueOutlineSpriteJump(sprite);
                }
            );
    }

    startOutlinePulse()
    {
        this.stopOutlinePulse();
        this.resetOutlineWobble();
        this.outlineWobbleActive = true;

        this.outlineSprites.forEach((sprite) =>
        {
            sprite.jumpDelay =
                this.scene.time.delayedCall(
                    Phaser.Math.Between(0, 500),
                    () =>
                    {
                        sprite.jumpDelay = null;
                        this.queueOutlineSpriteJump(sprite);
                    }
                );
        });
    }

    stopOutlinePulse()
    {
        this.outlineWobbleActive = false;

        this.outlineSprites.forEach((sprite) =>
        {
            if (sprite.jumpDelay)
            {
                sprite.jumpDelay.remove();
                sprite.jumpDelay = null;
            }
        });

        this.resetOutlineWobble();
    }

    startWorkDotsAnimation()
    {
        this.stopWorkDotsAnimation();
        this.workDotIndex = 0;
        this.headlineText.setText('WORK.');

        this.workDotsTimer =
            this.scene.time.addEvent({
                delay: 450,
                loop: true,
                callback: () =>
                {
                    this.workDotIndex =
                        (this.workDotIndex + 1) % 3;

                    const dots =
                        '.'.repeat(this.workDotIndex + 1);

                    this.headlineText.setText(
                        `WORK${dots}`
                    );
                }
            });
    }

    stopWorkDotsAnimation()
    {
        if (this.workDotsTimer)
        {
            this.workDotsTimer.remove();
            this.workDotsTimer = null;
        }
    }

    show(type, onConfirm)
    {
        this.onConfirm = onConfirm;

        const isPass = type === 'pass';

        this.stopWorkDotsAnimation();

        if (isPass)
        {
            this.headlineText.setText('GOOD JOB!');
        }
        else
        {
            this.startWorkDotsAnimation();
        }

        this.fitPortrait(
            isPass
                ? 'level-pass-portrait'
                : 'level-fail-portrait'
        );

        this.startOutlinePulse();

        this.button.setText(
            isPass
                ? '新的一天'
                : '这个懒我一定要偷'
        );

        this.container.setVisible(true);
        this.container.setAlpha(0);
        this.box.setScale(0.3);
        this.headlineText.setAlpha(0);
        this.portraitOutlineContainer.setAlpha(0);
        this.portrait.setAlpha(0);
        this.button.setAlpha(0);

        this.scene.tweens.add({
            targets: this.container,
            alpha: 1,
            duration: 220,
            ease: 'Sine.easeOut'
        });

        this.scene.tweens.add({
            targets: this.box,
            scaleX: 1,
            scaleY: 1,
            duration: 380,
            ease: 'Back.easeOut'
        });

        this.scene.tweens.add({
            targets: [
                this.headlineText,
                this.portraitOutlineContainer,
                this.portrait,
                this.button
            ],
            alpha: 1,
            duration: 280,
            delay: 180,
            ease: 'Sine.easeOut'
        });
    }

    hide()
    {
        this.stopWorkDotsAnimation();
        this.stopOutlinePulse();
        this.scene.isResultShowing = false;
        this.onConfirm = null;
        this.container.setVisible(false);
        this.box.setScale(1);
        this.headlineText.setAlpha(1);
        this.portraitOutlineContainer.setAlpha(1);
        this.portrait.setAlpha(1);
        this.button.setAlpha(1);
    }
}
