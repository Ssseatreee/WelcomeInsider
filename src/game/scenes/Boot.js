import { Scene } from 'phaser';
import NPCManager from '../../systems/NPCManager';
import levels from '../../data/levels';
import NPCEntity from '../../systems/entities/NPCEntity';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

        this.load.image('background', 'assets/bg.png');
    }

    create ()
    {
        this.scene.start('Preloader');

        this.game.npcManager = new NPCManager();

        const levelData =
            levels[1];

        levelData.npcs.forEach(
            (npcData, index) => {

                const npc =
                    new NPCEntity({

                        id: `npc_${index}`,

                        name:
                            npcData.name,

                        mapKey:
                            npcData.mapKey,

                        x:
                            npcData.x,

                        y:
                            npcData.y,

                        type:
                            npcData.type,

                        moveSpeed:
                            npcData.moveSpeed,

                        hasEmpathy:
                            npcData.hasEmpathy
                    });

                this.game.npcManager
                    .register(npc);

            }
        );
    }
}
