import * as Phaser from 'phaser';
import { getAchievementById } from '../data/achievements.js';
import { withTextPadding } from '../data/textStyle.js';
import {
    GAME_HEIGHT,
    HUD_WIDTH
} from '../game/layout.js';
import { playAchievementDing } from './Sfx.js';

const DISPLAY_MS = 3200;
const MARGIN = 16;
const PANEL_W = 280;
const PANEL_H = 72;

export default class AchievementUnlockNotice
{
    constructor(scene)
    {
        this.scene = scene;
        this.hideTimer = null;

        // 右侧 HUD 相机与左侧共用世界坐标原点，x 取 viewport 宽度内（非 RIGHT_HUD_X 偏移）
        this.anchorX = HUD_WIDTH - MARGIN;
        this.anchorY = GAME_HEIGHT - MARGIN;

        this.container =
            scene.add.container(
                this.anchorX,
                this.anchorY
            );

        this.container.setScrollFactor(0);
        this.container.setDepth(1600);
        this.container.setVisible(false);
        this.container.setAlpha(0);

        this.panel =
            scene.add.rectangle(
                0,
                0,
                PANEL_W,
                PANEL_H,
                0x111111,
                0.92
            );

        this.panel.setOrigin(1, 1);
        this.panel.setStrokeStyle(2, 0xffcc66, 0.9);
        this.container.add(this.panel);

        this.icon =
            scene.add.image(-PANEL_W + 28, -36, 'achievement-goodSenior');

        this.icon.setOrigin(0.5);
        this.container.add(this.icon);

        this.titleText =
            scene.add.text(
                -PANEL_W + 56,
                -52,
                '',
                withTextPadding({
                    fontSize: '20px',
                    color: '#ffdd88',
                    fontStyle: 'bold'
                })
            );

        this.titleText.setOrigin(0, 0);
        this.container.add(this.titleText);

        this.subtitleText =
            scene.add.text(
                -PANEL_W + 56,
                -28,
                '成就解锁',
                withTextPadding({
                    fontSize: '15px',
                    color: '#cccccc'
                })
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
        playAchievementDing(this.scene);
        this.container.setVisible(true);
        this.container.setAlpha(0);
        this.container.y = this.anchorY + 12;

        this.scene.tweens.add({
            targets: this.container,
            alpha: 1,
            y: this.anchorY,
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
            y: this.anchorY + 8,
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
