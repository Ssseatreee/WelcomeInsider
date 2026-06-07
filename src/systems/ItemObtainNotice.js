import {
    GAME_HEIGHT,
    PLAY_AREA_UI_CENTER_X
} from '../game/layout.js';
import { withTextPadding } from '../data/textStyle.js';
import { playCollectSfx } from './Sfx.js';

const DISPLAY_MS = 2000;
const FADE_MS = 180;

export default class ItemObtainNotice
{
    constructor(scene)
    {
        this.scene = scene;
        this.isShowing = false;
        this.hideTimer = null;
        this.fadeTimer = null;
        this.onComplete = null;

        this.container =
            scene.add.container(
                PLAY_AREA_UI_CENTER_X,
                GAME_HEIGHT / 2 - 24
            );

        this.container.setScrollFactor(0);
        this.container.setDepth(1500);
        this.container.setVisible(false);
        this.container.setAlpha(0);

        this.icon =
            scene.add.image(0, -56, 'item-coffee');

        this.icon.setScrollFactor(0);
        this.container.add(this.icon);

        this.messageText =
            scene.add.text(
                0,
                24,
                '',
                withTextPadding({
                    fontSize: '32px',
                    color: '#ffffff',
                    fontStyle: 'bold',
                    align: 'center'
                })
            );

        this.messageText.setOrigin(0.5, 0);
        this.messageText.setScrollFactor(0);
        this.container.add(this.messageText);
    }

    show(item, onComplete = null)
    {
        if (!item?.name)
        {
            onComplete?.();
            return;
        }

        this.showMessage(
            `~获得${item.name}~`,
            onComplete,
            item.textureKey
        );
    }

    showMessage(message, onComplete = null, textureKey = null)
    {
        if (!message)
        {
            onComplete?.();
            return;
        }

        this.clearTimers();
        this.onComplete = onComplete;
        this.isShowing = true;

        playCollectSfx(this.scene);

        this.messageText.setText(message);

        if (
            textureKey
            &&
            this.scene.textures.exists(textureKey)
        )
        {
            this.icon.setTexture(textureKey);
            this.icon.setVisible(true);
            this.fitIcon(this.icon);
            this.messageText.setY(24);
        }
        else
        {
            this.icon.setVisible(false);
            this.messageText.setY(0);
        }

        this.container.setVisible(true);
        this.container.setAlpha(0);

        this.scene.tweens.add({
            targets: this.container,
            alpha: 1,
            duration: FADE_MS,
            ease: 'Sine.easeOut'
        });

        this.hideTimer =
            this.scene.time.delayedCall(
                DISPLAY_MS,
                () => this.hide()
            );
    }

    hide()
    {
        if (!this.isShowing)
        {
            return;
        }

        this.clearTimers();

        const callback = this.onComplete;

        this.onComplete = null;

        this.scene.tweens.killTweensOf(this.container);

        this.fadeTimer =
            this.scene.time.delayedCall(
                FADE_MS,
                () => this.finishHide(callback)
            );

        this.scene.tweens.add({
            targets: this.container,
            alpha: 0,
            duration: FADE_MS,
            ease: 'Sine.easeIn',
            onComplete: () => this.finishHide(callback)
        });
    }

    finishHide(callback)
    {
        if (!this.isShowing)
        {
            return;
        }

        this.clearTimers();

        this.container.setVisible(false);
        this.container.setAlpha(0);
        this.isShowing = false;
        callback?.();
    }

    clearTimers()
    {
        if (this.hideTimer)
        {
            this.hideTimer.remove();
            this.hideTimer = null;
        }

        if (this.fadeTimer)
        {
            this.fadeTimer.remove();
            this.fadeTimer = null;
        }

        this.scene.tweens.killTweensOf(this.container);
    }

    fitIcon(icon)
    {
        const frame = icon.frame;

        if (!frame)
        {
            return;
        }

        const maxSize = 96;
        const scale = Math.min(
            maxSize / frame.width,
            maxSize / frame.height,
            1
        );

        icon.setScale(scale);
    }
}
