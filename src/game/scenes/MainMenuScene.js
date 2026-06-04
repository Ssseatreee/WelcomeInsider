import { Scene, Math as PhaserMath } from 'phaser';

import GameState from '../../systems/GameState.js';

import VolumeSettingsPanel from '../../systems/VolumeSettingsPanel.js';

import beginningClockConfig from '../../data/beginningClockConfig.js';

import {

    playEnterIfNeeded,

    readCurtainEnter,

    readCurtainTurnKey,

    transitionToScene

} from '../../systems/CurtainTransition.js';



/** 视差强度：鼠标在屏幕边缘时各层最大位移（像素），越远层幅度越大 */

const PARALLAX_STRENGTH = {

    ui: 8,

    front: -10,

    smoke: -18,

    wish: -26,

    back: -38

};



const WISH_TEXTURE_KEYS = [
    'cg-beginning-wish1',
    'cg-beginning-wish2'
];

/** 钟表指针：顺时针角速度（度/秒），sec_red > sec > min > hour */
const CLOCK_SPEED_DEG = beginningClockConfig.speedDeg;

const CLOCK_PIVOT = beginningClockConfig.pivot;

const BG_LAYERS = [

    { key: 'cg-beginning-back', strength: PARALLAX_STRENGTH.back, depth: 0 },

    {
        key: 'cg-beginning-hour',
        strength: PARALLAX_STRENGTH.back,
        depth: 0.2,
        clockRotate: true,
        clockSpeedDeg: CLOCK_SPEED_DEG.hour
    },

    {
        key: 'cg-beginning-min',
        strength: PARALLAX_STRENGTH.back,
        depth: 0.4,
        clockRotate: true,
        clockSpeedDeg: CLOCK_SPEED_DEG.min
    },

    {
        key: 'cg-beginning-sec',
        strength: PARALLAX_STRENGTH.back,
        depth: 0.6,
        clockRotate: true,
        clockSpeedDeg: CLOCK_SPEED_DEG.sec
    },

    {
        key: 'cg-beginning-sec-red',
        strength: PARALLAX_STRENGTH.back,
        depth: 0.8,
        clockRotate: true,
        clockSpeedDeg: CLOCK_SPEED_DEG.sec_red
    },

    {
        key: 'cg-beginning-wish',
        strength: PARALLAX_STRENGTH.wish,
        depth: 1,
        wishRotate: true
    },

    {
        key: WISH_TEXTURE_KEYS[0],
        strength: PARALLAX_STRENGTH.wish,
        depth: 2,
        wishRotate: true,
        wishSwap: true
    },

    { key: 'cg-beginning-front', strength: PARALLAX_STRENGTH.front, depth: 3 },

    { key: 'cg-beginning-smoke', strength: PARALLAX_STRENGTH.smoke, depth: 4 }

];



/** 视差弹簧：刚度越高回弹越快；阻尼越高停稳越快（略低于临界阻尼会有轻弹） */
const PARALLAX_OVERSHOOT = 1.12;

const PARALLAX_SPRING = 10;

const PARALLAX_DAMPING = 8;



/** smoke 单次上移距离（像素），完成后瞬间复位 */

const SMOKE_RISE_PX = 72;

const SMOKE_RISE_MS = 5200;



/** wish 瞬时跳变角度与每步停留时长 */

const WISH_SWING_DEG = 15;

const WISH_STEP_MS = 600;



export default class MainMenuScene extends Scene

{

    constructor()

    {

        super('MainMenuScene');

    }



    init(data)

    {

        this.curtainEnter = readCurtainEnter(data);

        this.curtainTurnKey = readCurtainTurnKey(data);

        this._curtainTransitioning = false;

    }



    create()

    {

        this.input.enabled = true;



        this.cameras.main.setBackgroundColor('#0a0a0a');



        this.centerX = this.scale.width / 2;

        this.centerY = this.scale.height / 2;



        this.parallaxTarget = { x: 0, y: 0 };

        this.parallaxOffset = { x: 0, y: 0 };

        this.parallaxVelocity = { x: 0, y: 0 };



        this.bgLayers = BG_LAYERS.map((entry) =>

        {

            const extraShiftY =
                entry.key === 'cg-beginning-smoke'
                    ? SMOKE_RISE_PX
                    : 0;

            if (entry.clockRotate)
            {
                const container =
                    this.add.container(
                        this.centerX,
                        this.centerY
                    );

                container.setDepth(entry.depth);

                const sprite =
                    this.add.image(0, 0, entry.key);

                this.fitCover(
                    sprite,
                    entry.strength,
                    extraShiftY
                );

                const dialOffsetX =
                    (CLOCK_PIVOT.x - 0.5)
                    * sprite.displayWidth;

                const dialOffsetY =
                    (CLOCK_PIVOT.y - 0.5)
                    * sprite.displayHeight;

                sprite.setPosition(
                    -dialOffsetX,
                    -dialOffsetY
                );

                container.add(sprite);

                return {

                    key: entry.key,

                    container,

                    sprite,

                    dialOffsetX,

                    dialOffsetY,

                    strength: entry.strength,

                    wishRotate: false,

                    wishSwap: false,

                    clockRotate: true,

                    clockSpeedDeg: entry.clockSpeedDeg,

                    clockAngle: 0

                };

            }

            const sprite =

                this.add.image(

                    this.centerX,

                    this.centerY,

                    entry.key

                );



            sprite.setDepth(entry.depth);

            this.fitCover(
                sprite,
                entry.strength,
                extraShiftY
            );



            return {

                key: entry.key,

                sprite,

                strength: entry.strength,

                isWish: entry.isWish ?? false,

                wishRotate: entry.wishRotate ?? false,

                wishSwap: entry.wishSwap ?? false,

                clockRotate: false,

                clockSpeedDeg: 0,

                clockAngle: 0

            };

        });

        this.wishTextureIndex = 0;



        this.startLayerAnimations();



        this.uiRoot =

            this.add.container(0, 0).setDepth(10);



        this.menuButtons = [];



        this.buildUi();



        this.input.on(

            'pointermove',

            pointer => this.setParallaxTarget(pointer)

        );



        playEnterIfNeeded(this);

        this.game.bgmManager?.playMenu(this);
    }



    fitCover(image, parallaxStrength = 0, extraShiftY = 0)

    {

        const vw = this.scale.width;

        const vh = this.scale.height;

        const scaleX = vw / image.width;

        const scaleY = vh / image.height;



        let cover = Math.max(scaleX, scaleY);



        const padX =
            Math.abs(parallaxStrength) * PARALLAX_OVERSHOOT;

        const padY =
            Math.abs(parallaxStrength) * PARALLAX_OVERSHOOT
            + extraShiftY;



        cover *= Math.max(

            (vw + padX * 2) / vw,

            (vh + padY * 2) / vh

        );



        image.setScale(cover);

    }



    setParallaxTarget(pointer)

    {

        const halfW = this.scale.width / 2;

        const halfH = this.scale.height / 2;



        this.parallaxTarget.x =

            PhaserMath.Clamp(

                (pointer.x - this.centerX) / halfW,

                -1,

                1

            );

        this.parallaxTarget.y =

            PhaserMath.Clamp(

                (pointer.y - this.centerY) / halfH,

                -1,

                1

            );

    }



    update(_time, delta)

    {

        const dt = Math.min(delta / 1000, 0.05);



        const dx =

            this.parallaxTarget.x - this.parallaxOffset.x;

        const dy =

            this.parallaxTarget.y - this.parallaxOffset.y;



        this.parallaxVelocity.x +=

            (dx * PARALLAX_SPRING

                - this.parallaxVelocity.x * PARALLAX_DAMPING)

            * dt;

        this.parallaxVelocity.y +=

            (dy * PARALLAX_SPRING

                - this.parallaxVelocity.y * PARALLAX_DAMPING)

            * dt;



        this.parallaxOffset.x +=

            this.parallaxVelocity.x * dt;

        this.parallaxOffset.y +=

            this.parallaxVelocity.y * dt;



        const nx =
            PhaserMath.Clamp(this.parallaxOffset.x, -1, 1);

        const ny =
            PhaserMath.Clamp(this.parallaxOffset.y, -1, 1);



        for (const layer of this.bgLayers)

        {

            let x =

                this.centerX + nx * layer.strength;

            let y =

                this.centerY + ny * layer.strength;



            if (layer.key === 'cg-beginning-smoke')

            {

                y -= this.smokeRiseAnim.rise * SMOKE_RISE_PX;

            }



            if (layer.clockRotate)

            {

                layer.container.setPosition(

                    x + layer.dialOffsetX,

                    y + layer.dialOffsetY

                );

                layer.clockAngle +=
                    layer.clockSpeedDeg * dt;

                layer.container.setRotation(

                    PhaserMath.DegToRad(layer.clockAngle)

                );

            }

            else

            {

                layer.sprite.setPosition(x, y);



                if (layer.wishRotate)

                {

                    layer.sprite.setRotation(

                        PhaserMath.DegToRad(

                            this.wishSwingAnim.angle

                        )

                    );

                }

            }

        }



        const uiStrength = PARALLAX_STRENGTH.ui;

        const uiOffsetX = nx * uiStrength;

        const uiOffsetY = ny * uiStrength;



        this.uiRoot.setPosition(uiOffsetX, uiOffsetY);



        for (const entry of this.menuButtons)

        {

            entry.button.setPosition(

                entry.baseX + uiOffsetX,

                entry.baseY + uiOffsetY

            );

        }

    }



    buildUi()

    {

        const cx = this.centerX;

        const ui = this.uiRoot;



        ui.add(

            this.add.text(

                cx,

                120,

                '隐现的工作周报',

                {

                    fontSize: '42px',

                    color: '#f5f0e8',

                    fontStyle: 'bold',

                    stroke: '#1a1208',

                    strokeThickness: 6

                }

            ).setOrigin(0.5)

        );



        ui.add(

            this.add.text(

                cx,

                180,

                '没在工作才是好员工啊',

                {

                    fontSize: '20px',

                    color: '#d4c8b8',

                    stroke: '#1a1208',

                    strokeThickness: 3

                }

            ).setOrigin(0.5)

        );



        this.addMenuButton(

            cx,

            280,

            '继续上班',

            () =>

            {

                if (!GameState.hasSave())

                {

                    return;

                }



                transitionToScene(this, 'LevelScene', {

                    continueGame: true

                });

            },

            { enabled: GameState.hasSave() }

        );



        this.addMenuButton(

            cx,

            350,

            '新的一周',

            () =>

            {

                GameState.resetForNewGame();

                GameState.clearSave();

                transitionToScene(this, 'LevelScene', {

                    level: 1

                });

            }

        );



        this.addMenuButton(

            cx,

            420,

            '查看收集物',

            () =>

            {

                transitionToScene(this, 'CollectionScene');

            }

        );



        this.addMenuButton(

            cx,

            490,

            '设置',

            () =>

            {

                this.settingsPanelVisible =
                    !this.settingsPanelVisible;

                this.volumeSettings?.setVisible(
                    this.settingsPanelVisible
                );

            }

        );



        this.settingsPanelVisible = false;

        this.volumeSettings =
            new VolumeSettingsPanel(this, {

                centerX: cx,

                topY: 548,

                width: 340,

                visible: false,

                depth: 12

            });

        this.uiRoot.add(
            this.volumeSettings.container
        );



        ui.add(

            this.add.text(

                cx,

                600,

                'Powered by Phaser',

                {

                    fontSize: '14px',

                    color: '#8a7f72'

                }

            ).setOrigin(0.5)

        );

    }



    addMenuButton(x, y, text, onClick, options = {})

    {

        const { enabled = true } = options;



        const button = this.createButton(x, y, text);



        button.setDepth(11);



        if (enabled)

        {

            button.on('pointerdown', onClick);

        }

        else

        {

            button.setAlpha(0.45);

            button.disableInteractive();

        }



        this.menuButtons.push({

            button,

            baseX: x,

            baseY: y

        });



        return button;

    }



    createButton(x, y, text)

    {

        const button = this.add.text(

            x,

            y,

            text,

            {

                fontSize: '28px',

                backgroundColor: 'rgba(20, 16, 12, 0.55)',

                color: '#f5f0e8',

                padding: {

                    left: 24,

                    right: 24,

                    top: 12,

                    bottom: 12

                }

            }

        )

        .setOrigin(0.5)

        .setInteractive({ useHandCursor: true });



        button.on('pointerover', () =>

        {

            button.setStyle({

                backgroundColor: 'rgba(48, 38, 28, 0.72)',

                color: '#fff8ee'

            });

        });



        button.on('pointerout', () =>

        {

            button.setStyle({

                backgroundColor: 'rgba(20, 16, 12, 0.55)',

                color: '#f5f0e8'

            });

        });



        return button;

    }



    startLayerAnimations()

    {

        this.smokeRiseAnim = { rise: 0 };



        this.tweens.add({

            targets: this.smokeRiseAnim,

            rise: 1,

            duration: SMOKE_RISE_MS,

            ease: 'Linear',

            repeat: -1

        });



        this.wishSwingAnim = { angle: 0 };



        const wishAngles = [

            WISH_SWING_DEG,

            0,

            -WISH_SWING_DEG,

            0

        ];



        let wishStepIndex = 0;

        const wishSwapLayer =
            this.bgLayers.find(layer => layer.wishSwap);



        this.time.addEvent({

            delay: WISH_STEP_MS,

            loop: true,

            callback: () =>

            {

                this.wishSwingAnim.angle =

                    wishAngles[

                        wishStepIndex % wishAngles.length

                    ];



                wishStepIndex += 1;



                if (wishSwapLayer)
                {
                    this.wishTextureIndex =
                        (this.wishTextureIndex + 1)
                        % WISH_TEXTURE_KEYS.length;

                    wishSwapLayer.sprite.setTexture(
                        WISH_TEXTURE_KEYS[
                            this.wishTextureIndex
                        ]
                    );

                    this.fitCover(
                        wishSwapLayer.sprite,
                        PARALLAX_STRENGTH.wish
                    );
                }

            }

        });

    }

}


