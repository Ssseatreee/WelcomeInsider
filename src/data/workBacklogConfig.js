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

    barWidth: 260,
    barHeight: 22,
    barColor: 0xff6644,
    barBgColor: 0x333333,

    title: '待处理工作',
    fullWarning: '积压的工作太多了！'
};
