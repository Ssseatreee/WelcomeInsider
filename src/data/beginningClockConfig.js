/**
 * 主菜单钟表指针 — 表盘中心（旋转枢轴）
 *
 * 素材为 6400×3600 全屏 CG，表盘在画面右上，不在图心。
 * 表盘中心不在图心：用 Container 放在表盘位置旋转，
 * 子 Image 偏移以保持与 back 层（origin 0.5）像素对齐。
 *
 * 微调：在 PS / Aseprite 里读表盘中心像素，改 pivotPx 即可。
 */
const TEXTURE_WIDTH = 6400;

const TEXTURE_HEIGHT = 3600;

/** 表盘中心像素（相对素材左上角）— 初值按 back 构图估算 */
const pivotPx = {
    x: 4305,
    y: 926
};

export default {
    textureWidth: TEXTURE_WIDTH,
    textureHeight: TEXTURE_HEIGHT,
    pivotPx,
    pivot: {
        x: pivotPx.x / TEXTURE_WIDTH,
        y: pivotPx.y / TEXTURE_HEIGHT
    },
    speedDeg: {
        hour: 5,
        min: 15,
        sec: 45,
        sec_red: 90
    }
};
