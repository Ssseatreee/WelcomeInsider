export default function createOrenAnimations(anims)
{
    anims.create({
        key: 'oren-right',
        frames: [
            { key: 'npc-oren', frame: 0 }
        ],
        frameRate: 1,
        repeat: -1
    });

    anims.create({
        key: 'oren-left',
        frames: [
            { key: 'npc-oren', frame: 1 }
        ],
        frameRate: 1,
        repeat: -1
    });

    anims.create({
        key: 'oren-up',
        frames: [
            { key: 'npc-oren', frame: 0 }
        ],
        frameRate: 1,
        repeat: -1
    });

    anims.create({
        key: 'oren-down',
        frames: [
            { key: 'npc-oren', frame: 1 }
        ],
        frameRate: 1,
        repeat: -1
    });
}
