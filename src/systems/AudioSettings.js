const STORAGE_KEY = 'welcome-insider-audio';

const DEFAULT_BGM_VOLUME = 0.8;

const DEFAULT_SFX_VOLUME = 0.8;

function clampVolume(value)
{
    return Math.max(0, Math.min(1, value));
}

const AudioSettings = {

    bgmVolume: DEFAULT_BGM_VOLUME,

    sfxVolume: DEFAULT_SFX_VOLUME,

    game: null,

    load()
    {
        try
        {
            const raw =
                localStorage.getItem(STORAGE_KEY);

            if (!raw)
            {
                return;
            }

            const data = JSON.parse(raw);

            if (typeof data.bgmVolume === 'number')
            {
                this.bgmVolume =
                    clampVolume(data.bgmVolume);
            }

            if (typeof data.sfxVolume === 'number')
            {
                this.sfxVolume =
                    clampVolume(data.sfxVolume);
            }
        }
        catch
        {
            // 忽略损坏的存档
        }
    },

    save()
    {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                bgmVolume: this.bgmVolume,
                sfxVolume: this.sfxVolume
            })
        );
    },

    bindGame(game)
    {
        this.game = game;
    },

    getBgmVolume()
    {
        return this.bgmVolume;
    },

    getSfxVolume()
    {
        return this.sfxVolume;
    },

    setBgmVolume(value)
    {
        this.bgmVolume = clampVolume(value);
        this.save();
        this.game?.bgmManager?.applyVolume();
    },

    setSfxVolume(value)
    {
        this.sfxVolume = clampVolume(value);
        this.save();
    },

    /** 播放音效时乘以全局音效音量 */
    playSfx(game, key, config = {})
    {
        const baseVolume = config.volume ?? 1;

        return game.sound.play(key, {
            ...config,
            volume: baseVolume * this.sfxVolume
        });
    }
};

export default AudioSettings;
