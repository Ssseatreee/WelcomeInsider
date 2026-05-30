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
            minimapColor: 0x99759c,
            moveSpeed: config.moveSpeed ?? 2
        });
    }

    onCatchPlayer(player)
    {
        console.log('V2 caught player');
    }
}
