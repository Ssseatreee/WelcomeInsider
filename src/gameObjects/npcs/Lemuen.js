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
            moveSpeed: config.moveSpeed ?? 2
        });
    }

    onCatchPlayer(player)
    {
        console.log('Lemuen caught player');
    }
}
