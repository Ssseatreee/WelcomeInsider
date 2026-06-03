const level2 = {

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
        }
    ],

    mission: {
        title: 'Tues',
        mode: 'all',
        objectives: [
            {
                id: 'survive_40',
                type: 'surviveTime',
                durationMs: 40000,
                label: '坚持 40 秒不被抓捕'
            },
            {
                id: 'talk_aze',
                type: 'talkNpc',
                npc: 'aze',
                label: '与艾泽尔搭话'
            }
        ]
    },

    intro: {
        portrait: { npc: 'aze', expression: 'normal' },
        title: '后辈很可靠',
        text:
            '偶尔也会有工作太多忙不过来的情况，\n'
            + '这种时候我会考虑让后辈来做，这对年轻人来说也是一种历练嘛。\n'
            + '他做事认真，很可靠，除此之外——\n'
            + '咖啡泡得也很好。'
    }
};

export default level2;
