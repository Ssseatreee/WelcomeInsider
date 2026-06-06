import * as Phaser from 'phaser';

const RIBBON_COLORS = [
    0xe099d4
];

const RIBBONS_PER_SIDE = 34;

/**
 * 结局按钮 — 彩带从屏幕两侧迸出并沿弧线落下（顶点无停顿）
 */
export default class EndingRibbonBurst
{
    constructor(scene)
    {
        this.scene = scene;
        this.ribbons = [];
        this.progressTargets = [];
        this.finishTimer = null;

        this.container =
            scene.add.container(0, 0);

        this.container.setScrollFactor(0);
        this.container.setDepth(9200);
    }

    play(durationMs, onComplete)
    {
        this.stop();

        const w = this.scene.scale.width;
        const h = this.scene.scale.height;

        for (let side = 0; side < 2; side += 1)
        {
            const fromLeft = side === 0;

            for (let i = 0; i < RIBBONS_PER_SIDE; i += 1)
            {
                const startY =
                    Phaser.Math.FloatBetween(
                        h * 0.08,
                        h * 0.92
                    );
                const startX =
                    fromLeft
                        ? Phaser.Math.FloatBetween(-72, -12)
                        : Phaser.Math.FloatBetween(
                            w + 12,
                            w + 72
                        );

                const ribbonW =
                    Phaser.Math.Between(6, 14);
                const ribbonH =
                    Phaser.Math.Between(48, 60);

                const ribbon =
                    this.scene.add.rectangle(
                        startX,
                        startY,
                        ribbonW,
                        ribbonH,
                        Phaser.Utils.Array.GetRandom(
                            RIBBON_COLORS
                        ),
                        1
                    );

                ribbon.setScrollFactor(0);
                ribbon.setAlpha(0);

                const startScale =
                    Phaser.Math.FloatBetween(0.4, 0.75);

                ribbon.setScale(startScale);

                const startRot =
                    Phaser.Math.FloatBetween(-0.8, 0.8);

                ribbon.setRotation(startRot);

                this.container.add(ribbon);
                this.ribbons.push(ribbon);

                const peakX =
                    fromLeft
                        ? Phaser.Math.FloatBetween(
                            w * 0.22,
                            w * 0.5
                        )
                        : Phaser.Math.FloatBetween(
                            w * 0.5,
                            w * 0.78
                        );
                const peakY =
                    startY
                    + Phaser.Math.FloatBetween(-100, 60);
                const fallX =
                    peakX
                    + Phaser.Math.FloatBetween(-40, 40);
                const fallY =
                    h
                    + Phaser.Math.FloatBetween(40, 120);
                const endRot =
                    startRot
                    + Phaser.Math.FloatBetween(1.4, 3.2)
                    * (fromLeft ? 1 : -1);
                const delay = Phaser.Math.Between(0, 160);
                const travelMs =
                    durationMs
                    + Phaser.Math.Between(-120, 120);

                const progress = { t: 0 };

                this.progressTargets.push(progress);

                this.scene.tweens.add({
                    targets: progress,
                    t: 1,
                    duration: travelMs,
                    delay,
                    ease: 'Linear',
                    onUpdate: () =>
                    {
                        const t = progress.t;
                        const omt = 1 - t;

                        ribbon.x =
                            omt * omt * startX
                            + 2 * omt * t * peakX
                            + t * t * fallX;
                        ribbon.y =
                            omt * omt * startY
                            + 2 * omt * t * peakY
                            + t * t * fallY;
                        ribbon.rotation =
                            Phaser.Math.Linear(
                                startRot,
                                endRot,
                                t
                            );

                        const scale =
                            Phaser.Math.Linear(
                                startScale,
                                1,
                                Math.min(t * 2.5, 1)
                            );

                        ribbon.setScale(scale);

                        if (t < 0.1)
                        {
                            ribbon.setAlpha(t / 0.1);
                        }
                        else if (t > 0.72)
                        {
                            ribbon.setAlpha(
                                (1 - t) / 0.28
                            );
                        }
                        else
                        {
                            ribbon.setAlpha(1);
                        }
                    }
                });
            }
        }

        this.finishTimer =
            this.scene.time.delayedCall(
                durationMs,
                () => onComplete?.()
            );
    }

    stop()
    {
        if (this.finishTimer)
        {
            this.finishTimer.remove();
            this.finishTimer = null;
        }

        this.progressTargets.forEach(target =>
        {
            this.scene.tweens.killTweensOf(target);
        });

        this.progressTargets = [];
        this.ribbons.forEach(ribbon =>
        {
            this.scene.tweens.killTweensOf(ribbon);
            ribbon.destroy();
        });

        this.ribbons = [];
        this.progressTargets = [];
        this.container.removeAll(false);
    }

    destroy()
    {
        this.stop();
        this.container?.destroy(true);
    }
}
