const level4 = {

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
        title: 'Thurs',
        mode: 'all',
        objectives: [
            {
                id: 'survive_60',
                type: 'surviveTime',
                durationMs: 60000,
                label: '坚持 60 秒不被抓捕'
            },
            {
                id: 'talk_oren',
                type: 'talkNpc',
                npc: 'oren',
                label: '与奥伦搭话'
            }
        ]
    },

    intro: {
        portrait: { npc: 'oren', expression: 'normal' },
        title: '老同学很麻烦',
        text:
            '尽管您没见过他，但我想您早已经听说了。\n'
            + '我是有一位，呃，挺有自己想法的同学。\n'
            + '虽然他为了拉特兰，总是闹出些事情，让人下意识警觉，\n'
            + '但人不算坏，而且——'
            + '一说起他来，我的事情就能先放一边了呢。'
    }
};

export default level4;
