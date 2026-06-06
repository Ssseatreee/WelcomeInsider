const itemRegistry = {
    azeCoffee: {
        id: 'azeCoffee',
        name: '艾泽尔的咖啡',
        textureKey: 'item-coffee',
        speedMultiplier: 1.5,
        effectMessage: '移速上升',
        description:
            '艾泽尔亲手泡的咖啡。喝下后脚步会轻快许多。'
    },

    donut: {
        id: 'donut',
        name: '甜甜圈',
        textureKey: 'item-donut',
        description:
            '休息室长桌上的甜品。糖霜亮晶晶的，让人想偷吃一口。'
    },

    drone: {
        id: 'drone',
        name: '斯普莉雅的无人机',
        textureKey: 'item-drone',
        effectMessage: '小地图上可看见所有人员',
        description:
            '斯普莉雅给的无人机。无论是否有共感，都能在小地图上看到所有人员。'
    },

    splyRefuse: {
        effectMessage:
            '斯普莉雅告知了费德里科你的位置'
    },

    clearWork: {
        effectMessage:
            '艾泽尔帮你完成了工作，未处理工作已清零'
    }
};

export function resolveItem(itemKey)
{
    if (!itemKey)
    {
        return null;
    }

    if (itemRegistry[itemKey]?.id)
    {
        return itemRegistry[itemKey];
    }

    return Object.values(itemRegistry).find(
        item => item.name === itemKey
    ) ?? null;
}

export function getCollectibleItems()
{
    return Object.values(itemRegistry).filter(
        item => item.id && item.textureKey
    );
}

export default itemRegistry;
