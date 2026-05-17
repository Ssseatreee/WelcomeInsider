import NPC from './NPC';

export default class V2 extends NPC
{
    constructor(scene, x, y)
    {
        super(scene, x, y, 'v2', 'v2');

        this.npcName = 'v2';

        this.speed = 120;
    }

    update()
    {
        // 以后这里写AI
    }

    onCatchPlayer(player)
    {
        console.log('V2 caught player');
    }
}