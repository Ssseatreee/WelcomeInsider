export default function createLemuenAnimations(anims)
{
    anims.create({
        key: 'lemuen-right',
        frames: [{ key:'lemuen', frame: 0 }],
        frameRate: 1,
        repeat: -1
    });

    anims.create({
        key: 'lemuen-left',
        frames: [{ key:'lemuen', frame: 1 }],
        frameRate: 1,
        repeat: -1
    });

    anims.create({
        key: 'lemuen-up',
        frames: [{ key:'lemuen', frame: 0 }],
        frameRate: 1,
        repeat: -1
    });

    anims.create({
        key: 'lemuen-down',
        frames: [{ key:'lemuen', frame: 1 }],
        frameRate: 1,
        repeat: -1
    });
}
