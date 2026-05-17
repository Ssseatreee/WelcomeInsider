import { Scene } from 'phaser';

import createPlayerAnimations from '../../animations/playerAnimations';
import createV2Animations from '../../animations/v2Animations';
import createFedericoAnimations from '../../animations/federicoAnimations';
import createLemuenAnimations from '../../animations/lemuenAnimations';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, 'background');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');

        // player
        this.load.spritesheet(
            'player', 
            '../../../public/assets/sprites/richele_sprite.png', 
            { frameWidth: 32, frameHeight: 32 }
        );

        // npc
        this.load.spritesheet(
            'v2',
            '../../../public/assets/sprites/v2_sprite.png',
            { frameWidth: 32, frameHeight: 32 }
        );
        
        this.load.spritesheet(
            'federico',
            '../../../public/assets/sprites/federico_sprite.png',
            { frameWidth: 32, frameHeight: 32 }
        );

        this.load.spritesheet(
            'lemuen',
            '../../../public/assets/sprites/lemuen_sprite.png',
            { frameWidth: 32, frameHeight: 32 }
        );

        this.load.image('logo', 'logo.png');
        this.loadPortraits();

    }

    loadPortraits()
    {
        // richele
        this.load.image(
            'portrait-richele-normal',
            '../../../public/assets/portraits/richele/normal.png'
        );
        this.load.image(
            'portrait-richele-happy',
            '../../../public/assets/portraits/richele/happy.png'
        );
        this.load.image(
            'portrait-richele-stress',
            '../../../public/assets/portraits/richele/stress.png'
        );
        this.load.image(
            'portrait-richele-suprise',
            '../../../public/assets/portraits/richele/suprise.png'
        );
        this.load.image(
            'portrait-richele-strict',
            '../../../public/assets/portraits/richele/strict.png'
        );

        // v2
        this.load.image(
            'portrait-v2-normal',
            '../../../public/assets/portraits/v2/normal.png'
        );
        this.load.image(
            'portrait-v2-smile',
            '../../../public/assets/portraits/v2/smile.png'
        );
        this.load.image(
            'portrait-v2-thinking',
            '../../../public/assets/portraits/v2/thinking.png'
        );
        this.load.image(
            'portrait-v2-stress',
            '../../../public/assets/portraits/v2/stress.png'
        );
        this.load.image(
            'portrait-v2-biyan_smile',
            '../../../public/assets/portraits/v2/biyan_smile.png'
        );

    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.
        //player animations
        createPlayerAnimations(this.anims);
        //v2 animations
        createV2Animations(this.anims);
        //federico animations
        createFedericoAnimations(this.anims);
        //lemuen animations
        createLemuenAnimations(this.anims);


        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');


    }
}
