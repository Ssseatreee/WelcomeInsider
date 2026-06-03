const level3 = {

    playerSpawn: {
        x: 100,
        y: 300
    },

    npcs:
    [
        {
            name: 'v2',
            x: 500,
            y: 300,
            mapKey: 'drinkingroom',
            type: 'hunter',
            hasEmpathy: true,
            moveSpeed: 2
        },

        {
            name: 'federico',
            x: 500,
            y: 200,
            mapKey: 'hall',
            type: 'hunter',
            hasEmpathy: false,
            moveSpeed: 3
        },

        {
            name: 'lemuen',
            x: 500,
            y: 300,
            mapKey: 'hall',
            type: 'hunter',
            hasEmpathy: true,
            moveSpeed: 2
        },

        {
            name: 'aze',
            x: 350,
            y: 260,
            mapKey: 'drinkingroom',
            type: 'neutral',
            moveSpeed: 0.7
        },

        {
            name: 'oren',
            x: 420,
            y: 280,
            mapKey: 'drinkingroom',
            type: 'neutral',
            moveSpeed: 1.8
        },

        {
            name: 'sply',
            x: 380,
            y: 220,
            mapKey: 'hall',
            type: 'neutral',
            moveSpeed: 1.2
        }
    ],

    mission: {
        title: 'Wed',
        mode: 'all',
        objectives: [
            {
                id: 'survive_40',
                type: 'surviveTime',
                durationMs: 40000,
                label: '坚持 40 秒不被抓捕'
            }
        ]
    },

    intro: {
        portrait: { npc: 'sply', expression: 'normal' },
        title: '同僚心情难测',
        text:
            '拉特兰常常是晴天，我们不必像其他地区那样抱怨天气预报。\n'
            + '但是萨科塔人跳脱的思维弥补了这一点。\n'
            + '比如教皇厅里那位您也认识的同僚，她总是凭心情行事。尽管有共感，我也很难预测。'
    }
};

export default level3;
