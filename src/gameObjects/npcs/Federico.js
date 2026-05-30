import NPC from './NPC';

export default class Federico extends NPC
{
    constructor(config)
    {
        super({
            ...config,
            name: 'federico',
            type: 'hunter',
            hasEmpathy: false,
            minimapColor: 0xefe6d0,
            moveSpeed: config.moveSpeed ?? 3
        });
    }

    onCatchPlayer(player)
    {
        console.log('Federico caught player');
    }
}
