import {
    GAME_HEIGHT,
    PLAY_AREA_X,
    PLAY_AREA_UI_CENTER_X
} from '../game/layout.js';
import { withTextPadding } from './textStyle.js';

/** 与 DialogueManager 对话框一致 */
export const DIALOGUE_BOX_Y = GAME_HEIGHT - 110;

/** 游戏内（主相机 viewport 内）对话框中心 x */
export const DIALOGUE_BOX_CENTER_X = PLAY_AREA_UI_CENTER_X;

/** 全屏场景（如成就页）对应对话框中心 x */
export const DIALOGUE_BOX_CENTER_X_FULL =
    PLAY_AREA_X + PLAY_AREA_UI_CENTER_X;

export const DIALOGUE_PORTRAIT_SCALE = 1.3;

/** 游戏内 — 主角立绘（对话框左侧） */
export const DIALOGUE_LEFT_PORTRAIT_X =
    DIALOGUE_BOX_CENTER_X - 320;

export const DIALOGUE_LEFT_PORTRAIT_Y =
    DIALOGUE_BOX_Y - 50;

/** 全屏场景 — 与游戏内同一屏幕位置 */
export const DIALOGUE_LEFT_PORTRAIT_X_FULL =
    DIALOGUE_BOX_CENTER_X_FULL - 320;

/** 成就页立绘相对对话位置的额外左移 */
export const COLLECTION_PORTRAIT_OFFSET_X = -200;

/** 成就页立绘缩放（大于游戏内对话的 1.3） */
export const COLLECTION_PORTRAIT_SCALE = 1.8;

export const DIALOGUE_TEXT_X =
    DIALOGUE_BOX_CENTER_X - 420;

export const DIALOGUE_TEXT_Y =
    DIALOGUE_BOX_Y - 70;

export const DIALOGUE_TEXT_X_FULL =
    DIALOGUE_BOX_CENTER_X_FULL - 420;

export const DIALOGUE_TEXT_STYLE = withTextPadding({
    fontSize: '30px',
    color: '#ffffff',
    wordWrap: { width: 840 },
    lineSpacing: 12
});

export function applyDialogueLeftPortrait(image, fullScreen = false)
{
    image.setPosition(
        fullScreen
            ? DIALOGUE_LEFT_PORTRAIT_X_FULL
                + COLLECTION_PORTRAIT_OFFSET_X
            : DIALOGUE_LEFT_PORTRAIT_X,
        DIALOGUE_LEFT_PORTRAIT_Y
    );
    image.setScale(
        fullScreen
            ? COLLECTION_PORTRAIT_SCALE
            : DIALOGUE_PORTRAIT_SCALE
    );
    image.setAlpha(1);
    image.setOrigin(0.5, 0.5);
}
