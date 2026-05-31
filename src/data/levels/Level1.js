import mapDisplayNames from "../mapDisplayNames";

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
        }
    ]

};

export default level1;