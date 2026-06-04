import workBacklogConfig from '../data/workBacklogConfig.js';
import {
    GAME_HEIGHT,
    HUD_WIDTH
} from '../game/layout.js';

export default class WorkBacklogBar
{
    constructor(scene)
    {
        this.scene = scene;

        const {
            panelWidth,
            panelHeight,
            panelOffsetLeft = 0,
            panelOffsetTop,
            barWidth,
            barHeight,
            barColor,
            barBgColor,
            title,
            fullWarning
        } = workBacklogConfig;

        this.fillDurationMs =
            workBacklogConfig.fillDurationMs;

        this.drainDurationMs =
            workBacklogConfig.drainDurationMs;

        this.speedBoostThreshold =
            workBacklogConfig.speedBoostThreshold;

        this.barColor = barColor;
        this.barBgColor = barBgColor;

        this.progress = 0;
        this.speedBoostApplied = false;
        this.fullWarningShown = false;

        this.onSpeedBoost = null;
        this.onSpeedBoostRevert = null;
        this.onFull = null;

        const panelLeft =
            panelOffsetLeft
            ?? Math.max(
                8,
                (HUD_WIDTH - panelWidth) / 2
            );

        const panelTop =
            panelOffsetTop
            ?? Math.max(
                8,
                (GAME_HEIGHT - panelHeight) / 2
            );

        this.container =
            scene.add.container(0, 0);

        this.container.setScrollFactor(0);
        this.container.setDepth(600);

        const bg =
            scene.add.rectangle(
                panelLeft + panelWidth / 2,
                panelTop + panelHeight / 2,
                panelWidth,
                panelHeight,
                0x111111,
                0.95
            );

        bg.setStrokeStyle(1, 0x444444);
        bg.setScrollFactor(0);
        this.container.add(bg);

        this.titleText =
            scene.add.text(
                panelLeft + panelWidth / 2,
                panelTop + 28,
                title,
                {
                    fontSize: '20px',
                    color: '#cccccc'
                }
            );

        this.titleText.setOrigin(0.5);
        this.titleText.setScrollFactor(0);
        this.container.add(this.titleText);

        this.barLeft = panelLeft + (panelWidth - barWidth) / 2;
        this.barTop = panelTop + 58;

        this.barGraphics =
            scene.add.graphics();

        this.barGraphics.setScrollFactor(0);
        this.container.add(this.barGraphics);

        this.warningText =
            scene.add.text(
                panelLeft + panelWidth / 2,
                panelTop + panelHeight - 28,
                fullWarning,
                {
                    fontSize: '16px',
                    color: '#ff8866',
                    align: 'center',
                    wordWrap: { width: panelWidth - 24 }
                }
            );

        this.warningText.setOrigin(0.5);
        this.warningText.setScrollFactor(0);
        this.warningText.setVisible(false);
        this.container.add(this.warningText);

        this.drawBar();
    }

    reset()
    {
        this.progress = 0;
        this.speedBoostApplied = false;
        this.fullWarningShown = false;
        this.warningText.setVisible(false);
        this.drawBar();
    }

    isFull()
    {
        return this.progress >= 1;
    }

    getProgress()
    {
        return this.progress;
    }

    update(delta, isWorking = false)
    {
        if (isWorking)
        {
            if (this.progress > 0)
            {
                const prevProgress = this.progress;

                this.progress = Math.max(
                    0,
                    this.progress - delta / this.drainDurationMs
                );

                if (
                    this.speedBoostApplied
                    &&
                    prevProgress >= this.speedBoostThreshold
                    &&
                    this.progress < this.speedBoostThreshold
                )
                {
                    this.speedBoostApplied = false;
                    this.onSpeedBoostRevert?.();
                }

                if (
                    this.fullWarningShown
                    &&
                    this.progress < 1
                )
                {
                    this.fullWarningShown = false;
                    this.warningText.setVisible(false);
                }
            }
        }
        else if (this.progress >= 1)
        {
            return;
        }
        else
        {
            this.progress = Math.min(
                1,
                this.progress + delta / this.fillDurationMs
            );

            if (
                !this.speedBoostApplied
                &&
                this.progress >= this.speedBoostThreshold
            )
            {
                this.speedBoostApplied = true;
                this.onSpeedBoost?.();
            }

            if (
                !this.fullWarningShown
                &&
                this.progress >= 1
            )
            {
                this.fullWarningShown = true;
                this.warningText.setVisible(true);
                this.onFull?.();
            }
        }

        this.drawBar();
    }

    drawBar()
    {
        const g = this.barGraphics;

        g.clear();

        g.fillStyle(this.barBgColor, 1);
        g.fillRect(
            this.barLeft,
            this.barTop,
            workBacklogConfig.barWidth,
            workBacklogConfig.barHeight
        );

        const fillWidth =
            workBacklogConfig.barWidth * this.progress;

        if (fillWidth > 0)
        {
            g.fillStyle(this.barColor, 1);
            g.fillRect(
                this.barLeft,
                this.barTop,
                fillWidth,
                workBacklogConfig.barHeight
            );
        }

        g.lineStyle(1, 0x666666, 1);
        g.strokeRect(
            this.barLeft,
            this.barTop,
            workBacklogConfig.barWidth,
            workBacklogConfig.barHeight
        );
    }
}
