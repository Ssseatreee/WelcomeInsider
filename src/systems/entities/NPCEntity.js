// 已弃用

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
                player.x - this.worldX;

            const dy =
                player.y - this.worldY;

            const len =
                Math.hypot(dx, dy);

            if (len > 1)
            {
                const speed = this.moveSpeed * delta * 0.05;
                this.worldX +=
                    dx / len * speed;

                this.worldY +=
                    dy / len * speed;
            }
        }

        // 检查与玩家的距离
        console.log(
            this.npcName,
            this.worldX,
            this.worldY
        );
    }
}