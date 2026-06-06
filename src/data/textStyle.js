/**
 * Phaser Text 在内部 canvas 绘制时，默认字框偏紧，
 * 中文字形顶部/底部容易被裁切。通过 padding + lineSpacing 留出余量。
 */

/** 文本纹理内边距（防止字形被裁切） */
export const TEXT_CANVAS_PADDING = {
    top: 12,
    bottom: 8,
    left: 8,
    right: 8
};

export const DEFAULT_LINE_SPACING = 10;

export const GAME_FONT_FAMILY =
    '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif';

/**
 * @param {import('phaser').Types.GameObjects.Text.TextStyle} [overrides]
 */
export function withTextPadding(overrides = {})
{
    const {
        padding: paddingOverride,
        lineSpacing,
        fontFamily,
        ...rest
    } = overrides;

    return {
        fontFamily: fontFamily ?? GAME_FONT_FAMILY,
        lineSpacing: lineSpacing ?? DEFAULT_LINE_SPACING,
        padding: {
            ...TEXT_CANVAS_PADDING,
            ...paddingOverride
        },
        ...rest
    };
}

/** 带 backgroundColor 的按钮标签内边距 */
export const BUTTON_LABEL_PADDING = {
    top: 18,
    bottom: 16,
    left: 24,
    right: 24
};

/**
 * @param {import('phaser').Types.GameObjects.Text.TextStyle} [overrides]
 */
export function withButtonTextStyle(overrides = {})
{
    return withTextPadding({
        ...overrides,
        padding: {
            ...BUTTON_LABEL_PADDING,
            ...overrides.padding
        }
    });
}
