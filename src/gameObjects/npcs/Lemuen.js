import NPC from './NPC';

export default class Lemuen extends NPC
{
    constructor(scene, x, y)
    {
        super(scene, x, y, 'lemuen', 'lemuen');

        this.npcName = 'lemuen';

        this.speed = 120;
    }

    update()
    {
        // 以后这里写AI
    }

    onCatchPlayer(player)
    {
        console.log('Lemuen caught player');
    }
}