export default function createPlayerAnimations(anims)
{
    anims.create({
        key: 'player_left',
        frames: [{ key: 'player', frame: 1 }],
        frameRate: 1,
        repeat: -1
    });

    anims.create({
        key: 'player_right',
        frames: [{ key: 'player', frame: 0 }],
        frameRate: 1,
        repeat: -1
    });

    anims.create({
        key: 'player_up',
        frames: [{ key: 'player', frame: 0 }],
        frameRate: 1,
        repeat: -1
    });

    anims.create({
        key: 'player_down',
        frames: [{ key: 'player', frame: 1 }],
        frameRate: 1,
        repeat: -1
    });
}