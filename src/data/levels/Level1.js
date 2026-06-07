const level1 = {

    playerSpawn: {
        mapKey: 'office',
        x: 100,
        y: 251
    },

    npcs:
    [
        {
            name:'v2',
            x:560,
            y:496,
            mapKey: 'hall',
            type: 'hunter',
            hasEmpathy: true,
            moveSpeed: 2
        },

        {
            name:'federico',
            x:656,
            y:496,
            mapKey: 'hall',
            type: 'hunter',
            hasEmpathy: false,
            moveSpeed: 3
        },

        {
            name:'lemuen',
            x:752,
            y:496,
            mapKey: 'hall',
            type: 'hunter',
            hasEmpathy: true,
            moveSpeed: 2
        }

    ],

    mission: {
        title: 'Mon',
        mode: 'all',
        objectives: [
            {
                id: 'survive_20',
                type: 'surviveTime',
                durationMs: 20000,
                label: '坚持 20 秒不被抓捕'
            }
        ]
    },

    intro: {
        portrait: { npc: 'v2', expression: 'normal' },
        title: '领导们很厉害',
        text:
            '...如您所知，尽管拉特兰人天性散漫，但教皇厅的领导们都不简单。\n'
            + '枢机，还有年轻的圣徒，\n'
            + '在几位手下工作，没什么偷懒的机会。\n'
            +'我？\n'
            +'哈哈，我对待工作，一直都很认真啊。'
    }

};

export default level1;