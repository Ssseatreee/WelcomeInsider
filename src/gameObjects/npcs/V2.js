import mapDisplayNames from '../../data/mapDisplayNames';
import NPC from './NPC';

export default class V2 extends NPC
{
    constructor(scene, x, y)
    {
        super(
            scene,
            x,
            y,
            {
                name: 'v2',

                texture: 'v2',

                type: 'hunter',

                hasEmpathy: true,

                moveSpeed: 2,

                minimapColor: 0xff4444,

                enableBubbleDialogue: false,

                mapKey: 'drinkingroom'
            }
        );
    }

    onCatchPlayer(player)
    {
        console.log('V2 caught player');
    }
}