import NPC from './NPC';
import GameState from '../../systems/GameState.js';

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

    update(context, delta)
    {
        if (GameState.isFedericoChasingPlayer())
        {
            const savedEmpathy = this.hasEmpathy;

            this.hasEmpathy = true;
            super.update(context, delta);
            this.hasEmpathy = savedEmpathy;

            return;
        }

        super.update(context, delta);
    }

    onCatchPlayer(player)
    {
        console.log('Federico caught player');
    }
}
