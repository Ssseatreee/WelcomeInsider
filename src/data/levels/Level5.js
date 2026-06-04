const level5 = {

    playerSpawn: {
        mapKey: 'office',
        x: 100,
        y: 251
    },

    npcs:
    [
        {
            name: 'v2',
            x: 500,
            y: 300,
            mapKey: 'hall',
            type: 'hunter',
            hasEmpathy: true,
            moveSpeed: 2
        },

        {
            name: 'federico',
            x: 500,
            y: 300,
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
        title: 'Fri',
        passOnCatch: true,
        objectives: [
            {
                id: 'survive_endless',
                type: 'surviveDisplay',
                label: '尽量坚持更长时间'
            }
        ]
    },

    intro: {
        portrait: { npc: 'federico', expression: 'stress' },
        title: '公证所的工作永无止境',
        text:
            '终于熬到周五了！\n'
            + '的确，公证所加班也不少，但是这周我不怎么担心这个。\n'
            + '明天我要到本舰报道，好歹我也是罗德岛的干员嘛。\n'
            + '顺便，我带了圈圈圈甜甜圈店的新品，您或许可以期待下。'
    }
};

export default level5;
