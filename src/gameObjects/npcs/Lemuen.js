import NPC from './NPC';

export default class Lemuen extends NPC
{
    constructor(config)
    {
        super({
            ...config,
            name: 'lemuen',
            type: 'hunter',
            hasEmpathy: true,
            minimapColor: 0xf2b1ba,
            moveSpeed: config.moveSpeed ?? 2
        });
    }

    onCatchPlayer(player)
    {
        console.log('Lemuen caught player');
    }
}
