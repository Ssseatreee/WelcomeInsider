import NPC from './NPC';

export default class Federico extends NPC
{
    constructor(scene, x, y)
    {
        super(scene, x, y, 'federico', 'federico');

        this.npcName = 'federico';

        this.speed = 80;
    }

    update()
    {

    }

    onCatchPlayer(player)
    {
        console.log('Federico caught player');
    }
}