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
        }
    ],

    mission: {
        title: '第四关',
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
    }
};

export default level4;
