export const GAME_HEIGHT = 768;

export const PLAY_AREA_WIDTH = 1024;

export const HUD_WIDTH = 384;

/** 右侧留白，与左侧 HUD 对称，使灰底游戏区在屏幕居中 */
export const RIGHT_MARGIN = HUD_WIDTH;

export const PLAY_AREA_X = HUD_WIDTH;

export const TOTAL_WIDTH =
    HUD_WIDTH + PLAY_AREA_WIDTH + RIGHT_MARGIN;

/** 主相机 viewport 内的 UI 坐标（不含 HUD 偏移） */
export const PLAY_AREA_UI_CENTER_X =
    PLAY_AREA_WIDTH / 2;
