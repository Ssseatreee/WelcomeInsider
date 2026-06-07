import * as Phaser from 'phaser';
import {
    withButtonTextStyle,
    withTextPadding
} from '../data/textStyle.js';
import {
    GAME_HEIGHT,
    PLAY_AREA_UI_CENTER_X,
    PLAY_AREA_WIDTH
} from '../game/layout.js';
import { bindButtonSfx } from './Sfx.js';

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
        this.onRetry = null;

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
                withTextPadding({
                    fontSize: '34px',
                    color: '#222222',
                    fontStyle: 'bold'
                })
            );

        this.headlineText.setOrigin(0.5);
        this.headlineText.setScrollFactor(0);
        this.container.add(this.headlineText);

        this.portraitY = this.centerY + 24;

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
                this.centerX - 118,
                boxTop + this.boxHeight - 44,
                '',
                withButtonTextStyle({
                    fontSize: '24px',
                    color: '#ffffff',
                    backgroundColor: '#333333',
                    padding: {
                        left: 20,
                        right: 20,
                        top: 16,
                        bottom: 14
                    }
                })
            );

        this.button.setOrigin(0.5);
        this.button.setScrollFactor(0);
        this.button.setInteractive({ useHandCursor: true });
        bindButtonSfx(this.button, this.scene);
        this.container.add(this.button);

        this.retryButton =
            this.scene.add.text(
                this.centerX + 118,
                boxTop + this.boxHeight - 44,
                '再来一次',
                withButtonTextStyle({
                    fontSize: '24px',
                    color: '#ffffff',
                    backgroundColor: '#333333',
                    padding: {
                        left: 20,
                        right: 20,
                        top: 16,
                        bottom: 14
                    }
                })
            );

        this.retryButton.setOrigin(0.5);
        this.retryButton.setScrollFactor(0);
        this.retryButton.setInteractive({ useHandCursor: true });
        bindButtonSfx(this.retryButton, this.scene);
        this.retryButton.setVisible(false);
        this.container.add(this.retryButton);

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

            callback?.();

            if (!this.scene.isEndingStarting)
            {
                this.hide();
            }
        });

        this.retryButton.on('pointerover', () =>
        {
            this.retryButton.setStyle({
                backgroundColor: '#555555'
            });
        });

        this.retryButton.on('pointerout', () =>
        {
            this.retryButton.setStyle({
                backgroundColor: '#333333'
            });
        });

        this.retryButton.on('pointerdown', () =>
        {
            if (
                !this.container.visible
                ||
                !this.retryButton.visible
            )
            {
                return;
            }

            const callback = this.onRetry;

            callback?.();
            this.hide();
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

    show(type, onConfirm, onRetry = null)
    {
        this.onConfirm = onConfirm;
        this.onRetry = onRetry;

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

        this.button.setText(
            isPass
                ? '新的一天'
                : '重试'
        );

        this.button.setX(
            isPass
                ? this.centerX - 118
                : this.centerX
        );

        this.retryButton.setVisible(isPass && Boolean(onRetry));

        this.container.setVisible(true);
        this.container.setAlpha(0);
        this.box.setScale(0.3);
        this.headlineText.setAlpha(0);
        this.portrait.setAlpha(0);
        this.button.setAlpha(0);
        this.retryButton.setAlpha(0);

        const fadeTargets = [
            this.headlineText,
            this.portrait,
            this.button
        ];

        if (isPass && onRetry)
        {
            fadeTargets.push(this.retryButton);
        }

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
            targets: fadeTargets,
            alpha: 1,
            duration: 280,
            delay: 180,
            ease: 'Sine.easeOut'
        });
    }

    hide()
    {
        this.stopWorkDotsAnimation();
        this.scene.isResultShowing = false;
        this.onConfirm = null;
        this.onRetry = null;
        this.container.setVisible(false);
        this.box.setScale(1);
        this.headlineText.setAlpha(1);
        this.portrait.setAlpha(1);
        this.button.setAlpha(1);
        this.retryButton.setAlpha(1);
        this.retryButton.setVisible(false);
    }
}
