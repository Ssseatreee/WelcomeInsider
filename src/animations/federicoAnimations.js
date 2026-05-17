export default function createFedericoAnimations(anims)
{
    anims.create({

        key: 'federico-right',

        frames: [
            { key: 'federico', frame: 0 }
        ],

        frameRate: 1,

        repeat: -1
    });

    anims.create({

        key: 'federico-left',

        frames: [
            { key: 'federico', frame: 1 }
        ],

        frameRate: 1,

        repeat: -1
    });

    anims.create({

        key: 'federico-up',
        frames: [
            { key: 'federico', frame: 0 }
        ],
        frameRate: 1,
        repeat: -1
    });

    anims.create({

        key: 'federico-down',
        frames: [
            { key: 'federico', frame: 1 }
        ],
        frameRate: 1,
        repeat: -1
    });
}