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
        title: '第二关',
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
    }
};

export default level2;
