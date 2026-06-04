/** 成就列表：顺序即收集页网格顺序（3 列，从左到右、从上到下） */
const achievements = [
    {
        id: 'goodSenior',
        title: '好前辈',
        textureKey: 'achievement-goodSenior',
        portraitKey: 'portrait-richele-smile',
        quote:
            '您或许也尝过他泡的咖啡？公证所的同事们都对他称赞有加。\n',
        lockedPortraitKey: 'portrait-richele-smile',
        lockedQuote:
            '艾泽尔的咖啡味道很好，\n'
            + '记得尝尝看。'
    },
    {
        id: 'plantCare',
        title: '爱护绿植',
        textureKey: 'achievement-plantCare',
        portraitKey: 'portrait-richele-smile',
        quote:
            '您也知道，我一直都很信守承诺的。\n',
        lockedPortraitKey: 'portrait-richele-biyan_speak',
        lockedQuote:
            '不到万不得已，也帮人保守下秘密吧。\n'
    },
    {
        id: 'accidentZone',
        title: '事故多发地',
        textureKey: 'achievement-accidentZone',
        portraitKey: 'portrait-richele-stress',
        quote:
            '哈哈...\n'
            + '别再提我的糗事了。',
        lockedPortraitKey: 'portrait-richele-strict',
        lockedQuote:
            '呃，您有看去年的那个一分钟泰拉小知识吗？\n'
            + '没看的话还是别看了。'
    },
    {
        id: 'peoplesRep',
        title: '民选代表',
        textureKey: 'achievement-peoplesRep',
        portraitKey: 'portrait-richele-smile',
        quote:
            '那天我也没想到就这样被同事们推着选上了代表……\n'
            + '再然后就来到了罗德岛。',
        lockedPortraitKey: 'portrait-richele-normal',
        lockedQuote:
            '办公区的告示板上贴着什么，\n'
            + '您有去看过吗？'
    },
    {
        id: 'gatherTogether',
        title: '欢聚！',
        textureKey: 'achievement-gatherTogether',
        portraitKey: 'portrait-richele-happy',
        quote:
            '今后也请您多多关照了，博士！\n',
        lockedPortraitKey: 'portrait-richele-smile',
        lockedQuote:
            '拉特兰的季节新品很好吃，\n'
            + '您最近来不了拉特兰的话，我给您带一些？'
    },
    {
        id: 'noMore',
        title: '没有更多了',
        alwaysAvailable: true,
        portraitKey: 'portrait-richele-dc',
        quote:
            '产能只能做这些了...\n'
    }
];

export const DEFAULT_COLLECTION_PORTRAIT =
    'portrait-richele-normal';

export const DEFAULT_COLLECTION_QUOTE =
    '休息一下吧，博士。';

export const LOCKED_COLLECTION_QUOTE =
    '这个成就还没有解锁。';

export function getAchievementById(id)
{
    return achievements.find(
        achievement => achievement.id === id
    );
}

/** 收集页展示：已解锁与未解锁使用不同立绘与台词 */
export function getAchievementDisplay(achievement, unlocked)
{
    if (unlocked || achievement.alwaysAvailable)
    {
        return {
            portraitKey:
                achievement.portraitKey
                ?? DEFAULT_COLLECTION_PORTRAIT,
            quote:
                achievement.quote
                ?? DEFAULT_COLLECTION_QUOTE
        };
    }

    return {
        portraitKey:
            achievement.lockedPortraitKey
            ?? DEFAULT_COLLECTION_PORTRAIT,
        quote:
            achievement.lockedQuote
            ?? LOCKED_COLLECTION_QUOTE
    };
}

export default achievements;
