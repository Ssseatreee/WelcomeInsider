import NPC from './NPC';

export default class V2 extends NPC
{
    constructor(config)
    {
        super({
            ...config,
            name: 'v2',
            type: 'hunter',
            hasEmpathy: true,
            moveSpeed: config.moveSpeed ?? 2
        });
    }

    onCatchPlayer(player)
    {
        console.log('V2 caught player');
    }
}
