import { Scene } from 'phaser';
import { transitionToScene } from '../../systems/CurtainTransition.js';

import createPlayerAnimations from '../../animations/playerAnimations';
import createV2Animations from '../../animations/v2Animations';
import createFedericoAnimations from '../../animations/federicoAnimations';
import createLemuenAnimations from '../../animations/lemuenAnimations';
import createAzeAnimations from '../../animations/azeAnimations';
import createOrenAnimations from '../../animations/orenAnimations';
import createSplyAnimations from '../../animations/splyAnimations';

const BAR_WIDTH = 468;
const BAR_HEIGHT = 32;
const BAR_FILL_INSET = 4;
const UI_ICON_SCALE = 0.18;

/** 预加载界面至少停留时长（毫秒） */
const MIN_PRELOAD_MS = 3500;

/** 进度条追赶速度，越小越慢 */
const PROGRESS_CATCHUP = 1.8;

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;
        const barLeft = cx - BAR_WIDTH / 2;

        this.add.rectangle(
            cx,
            cy,
            BAR_WIDTH,
            BAR_HEIGHT
        ).setStrokeStyle(2, 0xffffff);

        this.progressFill = this.add.rectangle(
            barLeft,
            cy,
            4,
            BAR_HEIGHT - BAR_FILL_INSET,
            0xffffff
        ).setOrigin(0, 0.5);

        this.donutIcon = this.add.image(
            barLeft + BAR_WIDTH,
            cy,
            'ui-donut'
        ).setScale(UI_ICON_SCALE).setDepth(2);

        this.tweens.add({
            targets: this.donutIcon,
            angle: 360,
            duration: 2200,
            repeat: -1
        });

        this.runnerIcon = this.add.image(
            barLeft,
            cy,
            'ui-left'
        ).setScale(UI_ICON_SCALE).setDepth(2);

        this.runnerSwapped = false;
        this.barLeft = barLeft;

        this.loadProgress = 0;
        this.displayProgress = 0;
        this.assetsReady = false;
        this.transitioning = false;
        this.preloadStartedAt = 0;

        this.load.on('progress', (progress) =>
        {
            this.loadProgress = progress;
        });
    }

    applyProgressDisplay(progress)
    {
        const fillW =
            Math.max(4, BAR_WIDTH * progress);

        this.progressFill.width = fillW;
        this.runnerIcon.x = this.barLeft + fillW;

        if (
            !this.runnerSwapped
            &&
            this.runnerIcon.x
            >= this.donutIcon.x
                - this.donutIcon.displayWidth * 0.35
        )
        {
            this.runnerIcon.setTexture('ui-right');
            this.runnerSwapped = true;
        }
    }

    update(_time, delta)
    {
        if (!this.preloadStartedAt)
        {
            this.preloadStartedAt = this.time.now;
        }

        const dt = delta / 1000;
        const diff =
            this.loadProgress - this.displayProgress;

        this.displayProgress +=
            diff * Math.min(1, PROGRESS_CATCHUP * dt);

        if (
            this.loadProgress >= 1
            &&
            this.displayProgress > 0.998
        )
        {
            this.displayProgress = 1;
        }

        this.applyProgressDisplay(this.displayProgress);

        if (this.assetsReady)
        {
            this.tryFinishPreload();
        }
    }

    tryFinishPreload()
    {
        if (
            this.transitioning
            ||
            this.displayProgress < 1
        )
        {
            return;
        }

        const elapsed =
            this.time.now - this.preloadStartedAt;

        if (elapsed < MIN_PRELOAD_MS)
        {
            return;
        }

        this.transitioning = true;
        transitionToScene(this, 'MainMenuScene');
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

        // npc（使用 npc- 前缀，避免与地图 tileset 键冲突）
        this.load.spritesheet(
            'npc-v2',
            '../../../public/assets/sprites/v2_sprite.png',
            { frameWidth: 32, frameHeight: 32 }
        );

        this.load.spritesheet(
            'npc-federico',
            '../../../public/assets/sprites/federico_sprite.png',
            { frameWidth: 32, frameHeight: 32 }
        );

        this.load.spritesheet(
            'npc-lemuen',
            '../../../public/assets/sprites/lemuen_sprite.png',
            { frameWidth: 32, frameHeight: 32 }
        );

        this.load.spritesheet(
            'npc-aze',
            '../../../public/assets/sprites/aze_sprite.png',
            { frameWidth: 32, frameHeight: 32 }
        );

        this.load.spritesheet(
            'npc-oren',
            '../../../public/assets/sprites/oren_sprite.png',
            { frameWidth: 32, frameHeight: 32 }
        );

        this.load.spritesheet(
            'npc-sply',
            '../../../public/assets/sprites/sply_sprite.png',
            { frameWidth: 32, frameHeight: 32 }
        );

        this.load.image('logo', 'logo.png');

        this.load.image(
            'item-coffee',
            '../../../public/assets/items/coffee.png'
        );

        this.load.image(
            'item-donut',
            '../../../public/assets/items/donut.png'
        );

        this.load.image(
            'item-drone',
            '../../../public/assets/items/drone.png'
        );

        this.load.image(
            'level-pass-portrait',
            '../../../public/assets/level/过关里凯莱_白纸稿.png'
        );

        this.load.image(
            'level-fail-portrait',
            '../../../public/assets/level/不过关里凯莱_白纸稿.png'
        );

        this.loadPortraits();

        this.loadMap();

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
        this.load.image(
            'portrait-richele-biyan_speak',
            '../../../public/assets/portraits/richele/biyan_speak.png'
        );
        this.load.image(
            'portrait-richele-smile',
            '../../../public/assets/portraits/richele/smile.png'
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

        // federico
        this.load.image(
            'portrait-federico-normal',
            '../../../public/assets/portraits/federico/normal.png'
        );
        this.load.image(
            'portrait-federico-smile',
            '../../../public/assets/portraits/federico/smile.png'
        );
        this.load.image(
            'portrait-federico-stress',
            '../../../public/assets/portraits/federico/stress.png'
        );
        this.load.image(
            'portrait-federico-biyan',
            '../../../public/assets/portraits/federico/biyan.png'
        );

        // lemuen
        this.load.image(
            'portrait-lemuen-normal',
            '../../../public/assets/portraits/lemuen/normal.png'
        );
        this.load.image(
            'portrait-lemuen-smile',
            '../../../public/assets/portraits/lemuen/smile.png'
        );
        this.load.image(
            'portrait-lemuen-strict',
            '../../../public/assets/portraits/lemuen/strict.png'
        );
        this.load.image(
            'portrait-lemuen-thinking',
            '../../../public/assets/portraits/lemuen/thinking.png'
        );

        // aze
        this.load.image(
            'portrait-aze-normal',
            '../../../public/assets/portraits/aze/normal.png'
        );
        this.load.image(
            'portrait-aze-smile',
            '../../../public/assets/portraits/aze/smile.png'
        );
        this.load.image(
            'portrait-aze-strict',
            '../../../public/assets/portraits/aze/strict.png'
        );
        this.load.image(
            'portrait-aze-suprise',
            '../../../public/assets/portraits/aze/suprise.png'
        );

        // oren
        this.load.image(
            'portrait-oren-normal',
            '../../../public/assets/portraits/oren/normal.png'
        );
        this.load.image(
            'portrait-oren-smile',
            '../../../public/assets/portraits/oren/smile.png'
        );
        this.load.image(
            'portrait-oren-strict',
            '../../../public/assets/portraits/oren/strict.png'
        );
        this.load.image(
            'portrait-oren-angry',
            '../../../public/assets/portraits/oren/angry.png'
        );
        this.load.image(
            'portrait-oren-yin',
            '../../../public/assets/portraits/oren/yin.png'
        );

        // sply
        this.load.image(
            'portrait-sply-normal',
            '../../../public/assets/portraits/sply/normal.png'
        );
        this.load.image(
            'portrait-sply-smile',
            '../../../public/assets/portraits/sply/smile.png'
        );
        this.load.image(
            'portrait-sply-biyan_smile',
            '../../../public/assets/portraits/sply/biyan_smile.png'
        );
        this.load.image(
            'portrait-sply-biyan_bad',
            '../../../public/assets/portraits/sply/biyan_bad.png'
        );
        this.load.image(
            'portrait-sply-biyan_cat',
            '../../../public/assets/portraits/sply/biyan_cat.png'
        );
        this.load.image(
            'portrait-sply-cat_thinking',
            '../../../public/assets/portraits/sply/cat_thinking.png'
        );

    }

    loadMap()
    {
        // tilemap
        this.load.tilemapTiledJSON(
            'hall',
            '../../../public/assets/maps/hall.json'
        );

        this.load.tilemapTiledJSON(
            'office',
            '../../../public/assets/maps/office.json'
        );

        this.load.tilemapTiledJSON(
            'office_1',
            '../../../public/assets/maps/office_1.json'
        );

        this.load.tilemapTiledJSON(
            'left',
            '../../../public/assets/maps/left.json'
        );

        this.load.tilemapTiledJSON(
            'right',
            '../../../public/assets/maps/right.json'
        );

        this.load.tilemapTiledJSON(
            'drinkingroom',
            '../../../public/assets/maps/drinkingroom.json'
        );

        this.load.tilemapTiledJSON(
            'toilet',
            '../../../public/assets/maps/toilet.json'
        );

        // tileset
        this.load.image(
            'tileset-hall',
            '../../../public/assets/tilesets/hall.png'
        );

        this.load.image(
            'tileset-drinkingroom',
            '../../../public/assets/tilesets/drinkingroom.png'
        );

        this.load.image(
            'tileset-office',
            '../../../public/assets/tilesets/office.png'
        );

        this.load.image(
            'tileset-border',
            '../../../public/assets/tilesets/border.png'
        );

        this.load.image(
            'tileset-toilet',
            '../../../public/assets/tilesets/toilet.png'
        );

        this.load.image(
            'tileset-Interiors_free_32x32',
            '../../../public/assets/tilesets/Interiors_free_32x32.png'
        );

        // office_essential 为 Tiled 图片集合，键名须与文件名一致
        const officeEssentialImages = [
            'cabinet.png',
            'Chair.png',
            'coffee-maker.png',
            'desk.png',
            'desk-with-pc.png',
            'PC1.png',
            'PC2.png',
            'plant.png',
            'printer.png',
            'Trash.png',
            'water-cooler.png'
        ];

        officeEssentialImages.forEach(fileName =>
        {
            this.load.image(
                fileName,
                `../../../public/assets/tilesets/office_essential/${fileName}`
            );
        });

        const beginningCgPath =
            '../../../public/assets/CG/beginning';

        this.load.image(
            'cg-beginning-back',
            `${beginningCgPath}/back.png`
        );

        this.load.image(
            'cg-beginning-wish',
            `${beginningCgPath}/wish.png`
        );

        this.load.image(
            'cg-beginning-wish1',
            `${beginningCgPath}/wish1.png`
        );

        this.load.image(
            'cg-beginning-wish2',
            `${beginningCgPath}/wish2.png`
        );

        this.load.image(
            'cg-beginning-smoke',
            `${beginningCgPath}/smoke.png`
        );

        this.load.image(
            'cg-beginning-front',
            `${beginningCgPath}/front.png`
        );

        for (let i = 1; i <= 5; i += 1)
        {
            this.load.image(
                `turn-${i}`,
                `${beginningCgPath}/turn/${i}.png`
            );
        }

        const bgmPath = '../../../public/assets/BGM';

        this.load.audio(
            'bgm-the-cafe',
            `${bgmPath}/Track 4 (The Cafe).wav`
        );

        this.load.audio(
            'bgm-traffic-lights',
            `${bgmPath}/Track 6 (Traffic Lights).wav`
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
        createAzeAnimations(this.anims);
        createOrenAnimations(this.anims);
        createSplyAnimations(this.anims);

        this.loadProgress = 1;
        this.assetsReady = true;
    }
}
