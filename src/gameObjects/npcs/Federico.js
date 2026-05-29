import NPC from './NPC';

export default class Federico extends NPC
{
    constructor(config)
    {
        super({
            ...config,
            name: 'federico'
        });
    }

    onCatchPlayer(player)
    {
        console.log('Federico caught player');
    }
}
