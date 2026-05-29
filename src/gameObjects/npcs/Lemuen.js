import NPC from './NPC';

export default class Lemuen extends NPC
{
    constructor(config)
    {
        super({
            ...config,
            name: 'lemuen'
        });
    }

    onCatchPlayer(player)
    {
        console.log('Lemuen caught player');
    }
}
