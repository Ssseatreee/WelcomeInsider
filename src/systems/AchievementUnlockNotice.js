import * as Phaser from 'phaser';
import { getAchievementById } from '../data/achievements.js';
import {
    GAME_HEIGHT,
    PLAY_AREA_X
} from '../game/layout.js';

const DISPLAY_MS = 2800;
const MARGIN = 20;

export default class AchievementUnlockNotice
{
    constructor(scene)
    {
        this.scene = scene;
        this.hideTimer = null;

        this.container =
            scene.add.container(
                PLAY_AREA_X + MARGIN,
                GAME_HEIGHT - MARGIN
            );

        this.container.setScrollFactor(0);
        this.container.setDepth(1600);
        this.container.setVisible(false);
        this.container.setAlpha(0);

        this.panel =
            scene.add.rectangle(
                0,
                0,
                280,
                72,
                0x111111,
                0.92
            );

        this.panel.setOrigin(0, 1);
        this.panel.setStrokeStyle(2, 0xffcc66, 0.9);
        this.container.add(this.panel);

        this.icon =
            scene.add.image(28, -36, 'achievement-goodSenior');

        this.icon.setOrigin(0.5);
        this.container.add(this.icon);

        this.titleText =
            scene.add.text(
                56,
                -52,
                '',
                {
                    fontSize: '20px',
                    color: '#ffdd88',
                    fontStyle: 'bold'
                }
            );

        this.titleText.setOrigin(0, 0);
        this.container.add(this.titleText);

        this.subtitleText =
            scene.add.text(
                56,
                -28,
                '成就解锁',
                {
                    fontSize: '15px',
                    color: '#cccccc'
                }
            );

        this.subtitleText.setOrigin(0, 0);
        this.container.add(this.subtitleText);
    }

    show(achievementId, onComplete = null)
    {
        const achievement =
            getAchievementById(achievementId);

        if (!achievement)
        {
            onComplete?.();
            return;
        }

        this.clearTimer();

        if (
            this.scene.textures.exists(
                achievement.textureKey
            )
        )
        {
            this.icon.setTexture(achievement.textureKey);
            this.fitIcon(this.icon, 44);
            this.icon.setVisible(true);
        }
        else
        {
            this.icon.setVisible(false);
        }

        this.titleText.setText(achievement.title);
        this.container.setVisible(true);
        this.container.setAlpha(0);
        this.container.y = GAME_HEIGHT - MARGIN + 12;

        this.scene.tweens.add({
            targets: this.container,
            alpha: 1,
            y: GAME_HEIGHT - MARGIN,
            duration: 220,
            ease: 'Back.easeOut'
        });

        this.hideTimer =
            this.scene.time.delayedCall(
                DISPLAY_MS,
                () => this.hide(onComplete)
            );
    }

    hide(onComplete = null)
    {
        this.clearTimer();

        this.scene.tweens.add({
            targets: this.container,
            alpha: 0,
            y: GAME_HEIGHT - MARGIN + 8,
            duration: 180,
            ease: 'Sine.easeIn',
            onComplete: () =>
            {
                this.container.setVisible(false);
                onComplete?.();
            }
        });
    }

    clearTimer()
    {
        if (this.hideTimer)
        {
            this.hideTimer.remove();
            this.hideTimer = null;
        }

        this.scene.tweens.killTweensOf(this.container);
    }

    fitIcon(icon, maxSize)
    {
        const frame = icon.frame;

        if (!frame)
        {
            return;
        }

        const scale = Math.min(
            maxSize / frame.width,
            maxSize / frame.height,
            1.5
        );

        icon.setScale(scale);
    }
}
