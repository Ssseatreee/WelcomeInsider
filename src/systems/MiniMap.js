class MiniMap {
    constructor(scene, npcManager) {
        this.scene = scene;
        this.npcManager = npcManager;

        this.scale = 0.1;

        this.icons = new Map();
    }

    update(currentMap, hasRadar) 
    {
        const npcs = this.npcManager.getVisibleNPCs(
            currentMap,
            hasRadar
        );

        // 清理旧标记
        this.icons.forEach(icon => icon.destroy());
        this.icons.clear();

        for (const npc of npcs) {

            const icon = this.scene.add.circle(
                0, 0, 3
            );

            icon.setScrollFactor(0);
            icon.setDepth(1000);

            // 类型颜色
            icon.fillColor = this.getColor(npc);

            // 映射坐标
            icon.x = npc.x * this.scale;
            icon.y = npc.y * this.scale;

            this.icons.set(npc.id, icon);
        }
    }

    getColor(npc) 
    {
        if (npc.type === 'catcher') {
            return npc.hasSense ? 0xff0000 : 0xff8800;
        }

        if (npc.type === 'neutral') {
            return 0x00ff00;
        }

        return 0x999999;
    }
}