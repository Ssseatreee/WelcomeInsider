export default class NPCEntity
{
    constructor(config)
    {
        this.id = config.id;

        this.npcName = config.name;

        this.currentMap =
            config.mapKey;

        this.worldX =
            config.x;

        this.worldY =
            config.y;

        this.type =
            config.type || 'civilian';

        this.moveSpeed =
            config.moveSpeed || 1.5;

        this.hasEmpathy =
            config.hasEmpathy || false;

        this.state = 'idle';
    }

    update(player, delta)
    {
        // Hunter AI
        if (
            this.type === 'hunter'
            &&
            this.hasEmpathy
        )
        {
            const dx =
                player.worldX - this.worldX;

            const dy =
                player.worldY - this.worldY;

            const len =
                Math.hypot(dx, dy);

            if (len > 1)
            {
                this.worldX +=
                    dx / len * this.moveSpeed;

                this.worldY +=
                    dy / len * this.moveSpeed;
            }
        }
    }
}