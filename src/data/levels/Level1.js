const level1 = {

    playerSpawn: {
        x: 100,
        y: 300
    },

    npcs:
    [
        {
            name:'v2',
            x:500,
            y:300,
            mapKey: 'drinkingroom',
            type: 'hunter',
            hasEmpathy: true,
            moveSpeed: 2
        },

        {
            name:'federico',
            x:500,
            y:200,
            mapKey: 'hall',
            type: 'hunter',
            hasEmpathy: false,
            moveSpeed: 3
        },

        {
            name:'lemuen',
            x:500,
            y:300,
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
            x: 280,
            y: 240,
            mapKey: 'drinkingroom',
            type: 'neutral',
            moveSpeed: 1.2
        }
    ],

    mission: {
        title: '第一关',
        mode: 'all',
        objectives: [
            {
                id: 'survive_20',
                type: 'surviveTime',
                durationMs: 20000,
                label: '坚持 20 秒不被抓捕'
            }
        ]
    }

};

export default level1;