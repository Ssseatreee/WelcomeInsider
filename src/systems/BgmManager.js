import { CURTAIN_BGM_FADE_OUT_MS } from './CurtainTransition.js';
import AudioSettings from './AudioSettings.js';

export const BGM_MENU = 'bgm-the-cafe';

export const BGM_LEVEL = 'bgm-traffic-lights';

const MENU_SCENE_KEYS = [
    'MainMenuScene',
    'CollectionScene'
];

const MENU_DELAY_MS = 500;

const LEVEL_DELAY_MS = 500;

const FADE_IN_MS = 800;

export default class BgmManager
{
    constructor(game)
    {
        this.game = game;
        this.currentKey = null;
        this.music = null;
        this.pendingTimer = null;
        this.fadeTween = null;
        this.fadeScene = null;
    }

    cancelPending()
    {
        if (this.pendingTimer)
        {
            this.pendingTimer.remove(false);
            this.pendingTimer = null;
        }
    }

    cancelFadeTween()
    {
        if (this.fadeTween)
        {
            this.fadeTween.stop();
            this.fadeTween = null;
        }

        this.fadeScene = null;
    }

    /** 两场景 BGM 相同则转场时不渐停（如主菜单 ↔ 收集物） */
    shouldFadeOnTransition(fromSceneKey, toSceneKey)
    {
        const fromBgm =
            this.getBgmForScene(fromSceneKey);

        const toBgm =
            this.getBgmForScene(toSceneKey);

        if (!toBgm)
        {
            return false;
        }

        if (!fromBgm)
        {
            return true;
        }

        return fromBgm !== toBgm;
    }

    getBgmForScene(sceneKey)
    {
        if (sceneKey === 'LevelScene')
        {
            return BGM_LEVEL;
        }

        if (MENU_SCENE_KEYS.includes(sceneKey))
        {
            return BGM_MENU;
        }

        return null;
    }

    /** 幕布转场开始时渐停当前 BGM */
    fadeOutForTransition(
        scene,
        durationMs = CURTAIN_BGM_FADE_OUT_MS
    )
    {
        this.cancelPending();

        if (
            !scene?.tweens
            ||
            !this.music
            ||
            !this.isPlaying()
        )
        {
            return;
        }

        this.cancelFadeTween();

        this.fadeScene = scene;

        this.fadeTween =
            scene.tweens.add({
                targets: this.music,
                volume: 0,
                duration: durationMs,
                ease: 'Linear',
                onComplete: () =>
                {
                    this.fadeTween = null;
                    this.fadeScene = null;
                    this.stop();
                }
            });
    }

    playMenu(scene, delayMs = MENU_DELAY_MS)
    {
        if (
            this.currentKey === BGM_MENU
            &&
            this.isPlaying()
        )
        {
            return;
        }

        this.schedule(scene, BGM_MENU, delayMs);
    }

    playLevel(scene, delayMs = LEVEL_DELAY_MS)
    {
        this.schedule(scene, BGM_LEVEL, delayMs);
    }

    schedule(scene, key, delayMs)
    {
        this.cancelPending();

        this.pendingTimer =
            scene.time.delayedCall(delayMs, () =>
            {
                this.pendingTimer = null;
                this.play(key, scene);
            });
    }

    isPlaying()
    {
        return Boolean(this.music?.isPlaying);
    }

    getTargetVolume()
    {
        return AudioSettings.getBgmVolume();
    }

    applyVolume()
    {
        if (
            this.music
            &&
            this.isPlaying()
            &&
            !this.fadeTween
        )
        {
            this.music.volume = this.getTargetVolume();
        }
    }

    play(key, scene, fadeInMs = FADE_IN_MS)
    {
        if (
            this.currentKey === key
            &&
            this.isPlaying()
        )
        {
            return;
        }

        this.stop();

        if (!this.game.cache.audio.exists(key))
        {
            return;
        }

        const targetVolume = this.getTargetVolume();

        this.music =
            this.game.sound.add(key, {
                loop: true,
                volume: fadeInMs > 0 ? 0 : targetVolume
            });

        this.music.play();
        this.currentKey = key;

        if (fadeInMs > 0 && scene?.tweens)
        {
            this.fadeScene = scene;

            this.fadeTween =
                scene.tweens.add({
                    targets: this.music,
                    volume: targetVolume,
                    duration: fadeInMs,
                    ease: 'Linear',
                    onComplete: () =>
                    {
                        this.fadeTween = null;
                        this.fadeScene = null;
                    }
                });
        }
    }

    stop()
    {
        this.cancelFadeTween();

        if (this.music)
        {
            this.music.stop();
            this.music.destroy();
            this.music = null;
        }

        this.currentKey = null;
    }
}
