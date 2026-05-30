/**
 * 小地图布局 — 对应实际地图连接关系：
 *
 *   office_1 ─┐
 *   office  ──┼─ left ── drinkingroom ── right
 *             │                      ╱
 *            hall ──────────────────╱
 */
export default {
    panelWidth: 372,
    panelHeight: 525,
    panelPadding: 15,
    panelOffsetLeft: 0,
    npcDotRadius: 5,
    playerDotRadius: 5,
    playerDotColor: 0x0034ef,

    /** tilemap 缓存不可用时的像素尺寸回退 */
    mapPixelSizes: {
        drinkingroom: { w: 768, h: 352 },
        hall: { w: 1312, h: 928 },
        left: { w: 128, h: 896 },
        right: { w: 960, h: 1280 },
        office: { w: 384, h: 384 },
        office_1: { w: 384, h: 384 }
    },

    maps: {
        drinkingroom: { x: 95, y: 44, w: 210, h: 60 },

        left: { x: 80, y: 111, w: 39, h: 234 },

        office_1: { x: 17, y: 119, w: 56, h: 63 },
        office: { x: 17, y: 194, w: 56, h: 63 },

        hall: { x: 92, y: 357, w: 213, h: 83 },

        right: { x: 269, y: 92, w: 71, h: 269 }
    }
};
