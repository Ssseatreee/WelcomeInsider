import { CURTAIN_BGM_FADE_OUT_MS } from './CurtainTransition.js';
import AudioSettings from './AudioSettings.js';

export const BGM_MENU = 'bgm-the-cafe';

export const BGM_LEVEL = 'bgm-traffic-lights';

export const BGM_WARM_INTRO = 'bgm-warm-intro';

export const BGM_WARM_LOOP = 'bgm-warm-loop';

const MENU_SCENE_KEYS = [
    'MainMenuScene',
    'CollectionScene'
];

const MENU_DELAY_MS = 300;

const LEVEL_DELAY_MS = 300;

/** 首次进入场景时的渐显；转场后不再二次渐显 */
const FADE_IN_MS = 900;

const ALL_BGM_KEYS = [
    BGM_MENU,
    BGM_LEVEL,
    BGM_WARM_INTRO,
    BGM_WARM_LOOP
];

function clamp01(value)
{
    return Math.max(0, Math.min(1, value));
}

function lerp(a, b, t)
{
    return a + (b - a) * t;
}

export default class BgmManager
{
    constructor(game)
    {
        this.game = game;
        this.currentKey = null;
        this.music = null;
        this.pendingTimeout = null;
        this.introLoopTimeout = null;
        this.fadeFrame = null;
        this.fadeStartedAt = 0;
        this.fadeFromVolume = 0;
        this.fadeToVolume = 0;
        this.fadeDurationMs = 0;
        this.fadeOnComplete = null;
        this.fadeGeneration = 0;
        /** 由 BgmManager 维护的当前输出音量，不读 Phaser 内部值 */
        this.outputVolume = 0;
        this.isTransitioningOut = false;
        this.pendingPlay = null;
        /** 转场渐停后，下一条 BGM 直接切到目标音量 */
        this.snapVolumeOnNextPlay = false;
    }

    cancelPending()
    {
        if (this.pendingTimeout != null)
        {
            clearTimeout(this.pendingTimeout);
            this.pendingTimeout = null;
        }

        this.pendingPlay = null;
    }

    cancelIntroLoopTimeout()
    {
        if (this.introLoopTimeout != null)
        {
            clearTimeout(this.introLoopTimeout);
            this.introLoopTimeout = null;
        }
    }

    cancelFade()
    {
        this.fadeGeneration += 1;

        if (this.fadeFrame != null)
        {
            cancelAnimationFrame(this.fadeFrame);
            this.fadeFrame = null;
        }

        this.fadeOnComplete = null;
    }

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

    forEachBgmSound(callback)
    {
        const mgr = this.game?.sound;

        if (!mgr)
        {
            return;
        }

        const list = mgr.sounds;

        if (!list)
        {
            return;
        }

        if (Array.isArray(list))
        {
            list.forEach(callback);
            return;
        }

        if (typeof list.forEach === 'function')
        {
            list.forEach(callback);
            return;
        }

        if (typeof list === 'object')
        {
            Object.values(list).forEach(callback);
        }
    }

    destroyAllBgmInstances()
    {
        const mgr = this.game?.sound;

        if (mgr)
        {
            for (const key of ALL_BGM_KEYS)
            {
                if (typeof mgr.stopByKey === 'function')
                {
                    mgr.stopByKey(key);
                }

                if (typeof mgr.removeByKey === 'function')
                {
                    mgr.removeByKey(key);
                }
            }

            this.forEachBgmSound(sound =>
            {
                if (
                    sound
                    &&
                    ALL_BGM_KEYS.includes(sound.key)
                )
                {
                    sound.stop?.();
                    sound.destroy?.();
                }
            });
        }

        this.music = null;
        this.currentKey = null;
        this.outputVolume = 0;
    }

    fadeOutForTransition(
        _scene,
        durationMs = CURTAIN_BGM_FADE_OUT_MS
    )
    {
        this.cancelPending();

        if (
            !this.music
            ||
            !this.isPlaying()
        )
        {
            this.isTransitioningOut = false;
            return;
        }

        this.isTransitioningOut = true;

        this.fadeVolumeTo(0, durationMs, () =>
        {
            this.isTransitioningOut = false;
            this.snapVolumeOnNextPlay = true;
            this.destroyAllBgmInstances();
            this.flushPendingPlay();
        });
    }

    playMenu(_scene, delayMs = MENU_DELAY_MS)
    {
        this.queuePlay(BGM_MENU, delayMs);
    }

    playLevel(_scene, delayMs = LEVEL_DELAY_MS)
    {
        this.queuePlay(BGM_LEVEL, delayMs);
    }

    queuePlay(key, delayMs)
    {
        this.pendingPlay = {
            key,
            readyAt: performance.now() + delayMs
        };

        this.tryStartPendingPlay();
    }

    tryStartPendingPlay()
    {
        if (!this.pendingPlay)
        {
            return;
        }

        if (this.isTransitioningOut)
        {
            return;
        }

        const waitMs =
            this.pendingPlay.readyAt - performance.now();

        if (waitMs > 0)
        {
            if (this.pendingTimeout != null)
            {
                clearTimeout(this.pendingTimeout);
            }

            this.pendingTimeout =
                setTimeout(() =>
                {
                    this.pendingTimeout = null;
                    this.tryStartPendingPlay();
                }, waitMs);

            return;
        }

        const { key } = this.pendingPlay;

        this.pendingPlay = null;

        if (this.pendingTimeout != null)
        {
            clearTimeout(this.pendingTimeout);
            this.pendingTimeout = null;
        }

        this.startKey(key);
    }

    flushPendingPlay()
    {
        if (!this.pendingPlay)
        {
            return;
        }

        this.tryStartPendingPlay();
    }

    playEndingWarm(_scene, fadeInMs = FADE_IN_MS)
    {
        this.cancelPending();
        this.cancelIntroLoopTimeout();
        this.cancelFade();
        this.destroyAllBgmInstances();
        this.snapVolumeOnNextPlay = false;

        const hasIntro =
            this.game.cache.audio.exists(BGM_WARM_INTRO);
        const hasLoop =
            this.game.cache.audio.exists(BGM_WARM_LOOP);

        if (!hasIntro && !hasLoop)
        {
            return;
        }

        if (!hasIntro)
        {
            this.startKey(BGM_WARM_LOOP, fadeInMs);
            return;
        }

        const targetVolume = this.getTargetVolume();

        this.music =
            this.game.sound.add(BGM_WARM_INTRO, {
                loop: false,
                volume: 0
            });

        this.outputVolume = 0;
        this.applyVolumeToMusic();
        this.music.play();
        this.currentKey = BGM_WARM_INTRO;

        let loopStarted = false;

        const startLoop = () =>
        {
            if (loopStarted || !hasLoop)
            {
                return;
            }

            loopStarted = true;
            this.cancelIntroLoopTimeout();

            if (this.currentKey !== BGM_WARM_INTRO)
            {
                return;
            }

            this.handoffToLoop();
        };

        if (typeof this.music.once === 'function')
        {
            this.music.once('complete', startLoop);
        }

        const introDuration = this.music.duration;

        if (Number.isFinite(introDuration) && introDuration > 0)
        {
            this.introLoopTimeout =
                setTimeout(
                    startLoop,
                    introDuration * 1000 + 50
                );
        }

        this.fadeVolumeTo(targetVolume, fadeInMs);
    }

    handoffToLoop()
    {
        const targetVolume = this.getTargetVolume();

        this.cancelFade();
        this.cancelIntroLoopTimeout();
        this.destroyAllBgmInstances();

        this.music =
            this.game.sound.add(BGM_WARM_LOOP, {
                loop: true,
                volume: targetVolume
            });

        this.outputVolume = targetVolume;
        this.applyVolumeToMusic();
        this.music.play();
        this.currentKey = BGM_WARM_LOOP;
    }

    isPlaying()
    {
        return Boolean(this.music?.isPlaying);
    }

    getTargetVolume()
    {
        return AudioSettings.getBgmVolume();
    }

    applyVolumeToMusic()
    {
        if (!this.music)
        {
            return;
        }

        this.music.volume = this.outputVolume;
    }

    setMusicVolume(value)
    {
        this.outputVolume = clamp01(value);
        this.applyVolumeToMusic();
    }

    applyVolume()
    {
        if (
            !this.music
            ||
            !this.isPlaying()
            ||
            this.fadeFrame != null
        )
        {
            return;
        }

        this.setMusicVolume(this.getTargetVolume());
    }

    fadeVolumeTo(targetVolume, durationMs, onComplete = null)
    {
        this.cancelFade();

        if (!this.music)
        {
            onComplete?.();
            return;
        }

        const generation = this.fadeGeneration;

        this.fadeFromVolume = this.outputVolume;
        this.fadeToVolume = clamp01(targetVolume);
        this.fadeDurationMs = Math.max(0, durationMs);
        this.fadeOnComplete = onComplete;
        this.fadeStartedAt = performance.now();

        if (this.fadeDurationMs <= 0)
        {
            this.setMusicVolume(this.fadeToVolume);

            const callback = this.fadeOnComplete;

            this.fadeOnComplete = null;
            callback?.();
            return;
        }

        const step = now =>
        {
            if (
                generation !== this.fadeGeneration
                ||
                !this.music
            )
            {
                this.fadeFrame = null;
                return;
            }

            const t =
                clamp01(
                    (now - this.fadeStartedAt)
                    / this.fadeDurationMs
                );

            this.setMusicVolume(
                lerp(
                    this.fadeFromVolume,
                    this.fadeToVolume,
                    t
                )
            );

            if (t < 1)
            {
                this.fadeFrame = requestAnimationFrame(step);
                return;
            }

            this.fadeFrame = null;
            this.setMusicVolume(this.fadeToVolume);

            const callback = this.fadeOnComplete;

            this.fadeOnComplete = null;
            callback?.();
        };

        this.fadeFrame = requestAnimationFrame(step);
    }

    startKey(key, fadeInMs = FADE_IN_MS)
    {
        if (
            this.currentKey === key
            &&
            this.isPlaying()
            &&
            this.fadeFrame == null
            &&
            !this.isTransitioningOut
        )
        {
            this.setMusicVolume(this.getTargetVolume());
            return;
        }

        this.cancelFade();
        this.cancelIntroLoopTimeout();
        this.destroyAllBgmInstances();

        if (!this.game.cache.audio.exists(key))
        {
            return;
        }

        const targetVolume = this.getTargetVolume();
        const shouldSnap =
            this.snapVolumeOnNextPlay
            ||
            fadeInMs <= 0;

        this.snapVolumeOnNextPlay = false;

        this.music =
            this.game.sound.add(key, {
                loop: true,
                volume: 0
            });

        this.outputVolume = 0;
        this.applyVolumeToMusic();
        this.music.play();
        this.currentKey = key;

        if (shouldSnap)
        {
            this.setMusicVolume(targetVolume);
            return;
        }

        this.fadeVolumeTo(targetVolume, fadeInMs);
    }

    stop()
    {
        this.cancelFade();
        this.cancelIntroLoopTimeout();
        this.cancelPending();
        this.isTransitioningOut = false;
        this.snapVolumeOnNextPlay = false;
        this.destroyAllBgmInstances();
    }
}
