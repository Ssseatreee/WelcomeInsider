export default {
    /** 积满所需时间（毫秒） */
    fillDurationMs: 30000,

    /** 达到此比例时提升追捕者速度 */
    speedBoostThreshold: 0.5,

    /** 速度提升倍率 */
    speedBoostMultiplier: 1.5,

    panelWidth: 320,
    panelHeight: 140,
    panelOffsetLeft: 32,
    /** 距顶部的偏移，数值越小面板越靠上 */
    panelOffsetTop: 100,

    /** 任务面板（位于工作进度条上方） */
    missionPanel: {
        gap: 10,
        height: 86
    },

    /** 物品栏（位于工作进度条下方） */
    itemPanel: {
        gap: 10,
        title: '物品',
        columns: 3,
        iconSize: 72,
        cellGap: 14,
        labelHeight: 22,
        labelFontSize: '14px'
    },

    barWidth: 260,
    barHeight: 22,
    barColor: 0xff6644,
    barBgColor: 0x333333,

    title: '待处理工作',
    fullWarning: '积压的工作太多了！'
};
