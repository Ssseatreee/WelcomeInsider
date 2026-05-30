export default function createLemuenAnimations(anims)
{
    anims.create({
        key: 'lemuen-right',
        frames: [{ key: 'npc-lemuen', frame: 0 }],
        frameRate: 1,
        repeat: -1
    });

    anims.create({
        key: 'lemuen-left',
        frames: [{ key: 'npc-lemuen', frame: 1 }],
        frameRate: 1,
        repeat: -1
    });

    anims.create({
        key: 'lemuen-up',
        frames: [{ key: 'npc-lemuen', frame: 0 }],
        frameRate: 1,
        repeat: -1
    });

    anims.create({
        key: 'lemuen-down',
        frames: [{ key: 'npc-lemuen', frame: 1 }],
        frameRate: 1,
        repeat: -1
    });
}
