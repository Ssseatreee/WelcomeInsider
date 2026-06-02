import { Scene, Math as PhaserMath } from 'phaser';

/** 视差强度：鼠标在屏幕边缘时各层最大位移（像素），越远层幅度越大 */
const PARALLAX_STRENGTH = {
    ui: 4,
    front: 10,
    smoke: 18,
    wish: 26,
    back: 38
};

const BG_LAYERS = [
    { key: 'cg-beginning-back', strength: PARALLAX_STRENGTH.back, depth: 0 },
    { key: 'cg-beginning-wish', strength: PARALLAX_STRENGTH.wish, depth: 1 },
    { key: 'cg-beginning-front', strength: PARALLAX_STRENGTH.front, depth: 2 },
    { key: 'cg-beginning-smoke', strength: PARALLAX_STRENGTH.smoke, depth: 3 }
];

/** 视差弹簧：刚度越高回弹越快；阻尼越高停稳越快（略低于临界阻尼会有轻弹） */
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

    create()
    {
        this.cameras.main.setBackgroundColor('#0a0a0a');

        this.centerX = this.scale.width / 2;
        this.centerY = this.scale.height / 2;

        this.parallaxTarget = { x: 0, y: 0 };
        this.parallaxOffset = { x: 0, y: 0 };
        this.parallaxVelocity = { x: 0, y: 0 };

        this.bgLayers = BG_LAYERS.map((entry) =>
        {
            const sprite =
                this.add.image(
                    this.centerX,
                    this.centerY,
                    entry.key
                );

            sprite.setDepth(entry.depth);
            this.fitCover(sprite);

            return {
                key: entry.key,
                sprite,
                strength: entry.strength
            };
        });

        this.startLayerAnimations();

        this.uiRoot =
            this.add.container(0, 0).setDepth(10);

        this.buildUi();

        this.input.on(
            'pointermove',
            pointer => this.setParallaxTarget(pointer)
        );
    }

    fitCover(image)
    {
        const scaleX = this.scale.width / image.width;
        const scaleY = this.scale.height / image.height;

        image.setScale(Math.max(scaleX, scaleY));
    }

    setParallaxTarget(pointer)
    {
        const halfW = this.scale.width / 2;
        const halfH = this.scale.height / 2;

        this.parallaxTarget.x =
            ((pointer.x - this.centerX) / halfW);
        this.parallaxTarget.y =
            ((pointer.y - this.centerY) / halfH);
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

        const nx = this.parallaxOffset.x;
        const ny = this.parallaxOffset.y;

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

            layer.sprite.setPosition(x, y);

            if (layer.key === 'cg-beginning-wish')
            {
                layer.sprite.setRotation(
                    PhaserMath.DegToRad(
                        this.wishSwingAnim.angle
                    )
                );
            }
        }

        const uiStrength = PARALLAX_STRENGTH.ui;

        this.uiRoot.setPosition(
            nx * uiStrength,
            ny * uiStrength
        );
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

        const startButton =
            this.createButton(cx, 320, '开始游戏');

        startButton.on('pointerdown', () =>
        {
            this.scene.start('LevelScene', { level: 1 });
        });

        ui.add(startButton);

        const collectionButton =
            this.createButton(cx, 400, '查看收集物');

        collectionButton.on('pointerdown', () =>
        {
            this.scene.start('CollectionScene');
        });

        ui.add(collectionButton);

        ui.add(
            this.add.text(
                cx,
                540,
                'Powered by Phaser',
                {
                    fontSize: '14px',
                    color: '#8a7f72'
                }
            ).setOrigin(0.5)
        );
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
            }
        });
    }
}
