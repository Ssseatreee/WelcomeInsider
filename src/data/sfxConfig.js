/** 预加载与播放用的音效键名 */
export const SFX = {
    DING: 'sfx-ding',
    KNOCK: 'sfx-knock',
    COLLECT: 'sfx-collect',
    BUTTON: 'sfx-button'
};

export const SFX_FILES = {
    [SFX.DING]:
        './assets/sound/freesound_community-ding-101492.mp3',
    [SFX.KNOCK]:
        './assets/sound/freesound_community-knocking-on-door-6022.mp3',
    [SFX.COLLECT]:
        './assets/sound/liecio-collect-points-190037.mp3',
    [SFX.BUTTON]:
        './assets/sound/emilianodleon-button-ui-sound-effect-395762.mp3'
};

/** 敲门音效从第几秒开始播放 */
export const SFX_KNOCK_START_SEC = 5;

/** 按钮音效从第几秒开始播放 */
export const SFX_BUTTON_START_SEC = 0.03;
