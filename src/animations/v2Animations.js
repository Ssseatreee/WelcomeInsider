export default function createV2Animations(anims)
{
    anims.create({

        key: 'v2-right',

        frames: [
            { key: 'v2', frame: 0 }
        ],

        frameRate: 1,

        repeat: -1
    });

    anims.create({

        key: 'v2-left',

        frames: [
            { key: 'v2', frame: 1 }
        ],

        frameRate: 1,

        repeat: -1
    });

    anims.create({

        key: 'v2-up',

        frames: [
            { key: 'v2', frame: 0 }
        ],

        frameRate: 1,

        repeat: -1
    });

    anims.create({

        key: 'v2-down', 
        frames: [
            { key: 'v2', frame: 1 }
        ],
        frameRate: 1,
        repeat: -1
    });
}