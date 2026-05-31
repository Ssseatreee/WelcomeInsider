export default function createAzeAnimations(anims)
{
    anims.create({
        key: 'aze-right',
        frames: [
            { key: 'npc-aze', frame: 0 }
        ],
        frameRate: 1,
        repeat: -1
    });

    anims.create({
        key: 'aze-left',
        frames: [
            { key: 'npc-aze', frame: 1 }
        ],
        frameRate: 1,
        repeat: -1
    });

    anims.create({
        key: 'aze-up',
        frames: [
            { key: 'npc-aze', frame: 0 }
        ],
        frameRate: 1,
        repeat: -1
    });

    anims.create({
        key: 'aze-down',
        frames: [
            { key: 'npc-aze', frame: 1 }
        ],
        frameRate: 1,
        repeat: -1
    });
}
