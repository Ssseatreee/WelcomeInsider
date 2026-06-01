export default function createSplyAnimations(anims)
{
    anims.create({
        key: 'sply-right',
        frames: [
            { key: 'npc-sply', frame: 0 }
        ],
        frameRate: 1,
        repeat: -1
    });

    anims.create({
        key: 'sply-left',
        frames: [
            { key: 'npc-sply', frame: 1 }
        ],
        frameRate: 1,
        repeat: -1
    });

    anims.create({
        key: 'sply-up',
        frames: [
            { key: 'npc-sply', frame: 0 }
        ],
        frameRate: 1,
        repeat: -1
    });

    anims.create({
        key: 'sply-down',
        frames: [
            { key: 'npc-sply', frame: 1 }
        ],
        frameRate: 1,
        repeat: -1
    });
}
