import AudioSettings from './AudioSettings.js';
import { SFX, SFX_KNOCK_START_SEC, SFX_BUTTON_START_SEC } from '../data/sfxConfig.js';

export { SFX };

/**
 * @param {import('phaser').Scene | import('phaser').Game} sceneOrGame
 */
export function playSfx(sceneOrGame, key, config = {})
{
    const game =
        sceneOrGame?.game
        ?? sceneOrGame;

    if (!game?.sound)
    {
        return null;
    }

    return AudioSettings.playSfx(game, key, config);
}

/**
 * 播放一次性音效（独立实例，播完自动销毁）
 * @param {import('phaser').Scene | import('phaser').Game} sceneOrGame
 */
export function playOneShotSfx(sceneOrGame, key)
{
    const game =
        sceneOrGame?.game
        ?? sceneOrGame;

    if (!game?.sound?.add)
    {
        return null;
    }

    if (!game.cache?.audio?.exists?.(key))
    {
        return null;
    }

    const sound =
        game.sound.add(key, {
            volume: AudioSettings.getSfxVolume()
        });

    if (!sound)
    {
        return null;
    }

    const cleanup = () =>
    {
        if (sound.isPlaying)
        {
            sound.stop();
        }

        sound.destroy();
    };

    if (typeof sound.once === 'function')
    {
        sound.once('complete', cleanup);
    }

    sound.play();

    if (sceneOrGame?.time)
    {
        sceneOrGame.time.delayedCall(8000, cleanup);
    }
    else
    {
        setTimeout(cleanup, 8000);
    }

    return sound;
}

/**
 * 为可点击按钮绑定统一点击音效
 * @param {import('phaser').GameObjects.GameObject} target
 * @param {import('phaser').Scene} scene
 */
export function bindButtonSfx(target, scene)
{
    if (!target?.on || target._buttonSfxBound)
    {
        return target;
    }

    target._buttonSfxBound = true;

    target.on('pointerdown', () =>
    {
        playSfx(scene, SFX.BUTTON, {
            seek: SFX_BUTTON_START_SEC
        });
    });

    return target;
}

export function playAchievementDing(scene)
{
    playOneShotSfx(scene, SFX.COLLECT);
}

export function playKnockSfx(scene, onComplete)
{
    const game = scene?.game ?? scene;

    if (!game?.sound)
    {
        onComplete?.();
        return null;
    }

    if (!game.cache?.audio?.exists?.(SFX.KNOCK))
    {
        onComplete?.();
        return null;
    }

    const meta = game.cache.audio.get(SFX.KNOCK);
    const duration = Number(meta?.duration) || 0;
    const seek =
        duration > SFX_KNOCK_START_SEC + 0.05
            ? SFX_KNOCK_START_SEC
            : 0;

    const sound =
        AudioSettings.playSfx(game, SFX.KNOCK, { seek });

    if (!sound)
    {
        onComplete?.();
        return null;
    }

    let finished = false;
    let pollTimer = null;
    let timeoutTimer = null;
    let playbackStarted = false;

    const cleanup = () =>
    {
        pollTimer?.remove();
        pollTimer = null;
        timeoutTimer?.remove();
        timeoutTimer = null;
    };

    const finish = () =>
    {
        if (finished)
        {
            return;
        }

        finished = true;
        cleanup();

        if (sound.isPlaying)
        {
            sound.stop();
        }

        onComplete?.();
    };

    if (typeof sound.once === 'function')
    {
        sound.once('complete', finish);
    }

    const remainingSec =
        duration > seek
            ? duration - seek
            : 4;

    const fallbackMs =
        Math.max(800, remainingSec * 1000 + 300);

    if (scene?.time)
    {
        pollTimer =
            scene.time.addEvent({
                delay: 50,
                loop: true,
                callback: () =>
                {
                    if (sound.isPlaying)
                    {
                        playbackStarted = true;
                    }

                    if (
                        playbackStarted
                        &&
                        !sound.isPlaying
                    )
                    {
                        finish();
                    }
                }
            });

        timeoutTimer =
            scene.time.delayedCall(fallbackMs, finish);
    }
    else
    {
        setTimeout(finish, fallbackMs);
    }

    return sound;
}

export function playCollectSfx(scene)
{
    playOneShotSfx(scene, SFX.DING);
}
