import * as Phaser from 'phaser';
import { withTextPadding } from '../data/textStyle.js';

const BASE_TEXT = '工作中';
const DOT_INTERVAL_MS = 450;
const OFFSET_Y = -42;
const WORK_STATUS_DEPTH = 4000;

export default class WorkStatusIndicator
{
    constructor(scene, player)
    {
        this.scene = scene;
        this.player = player;
        this.dotIndex = 0;

        this.container =
            scene.add.container(player.x, player.y + OFFSET_Y);

        this.bg =
            scene.add.rectangle(
                0,
                0,
                88,
                30,
                0xffffff,
                1
            );

        this.bg.setStrokeStyle(1, 0xdddddd);

        this.label =
            scene.add.text(
                0,
                0,
                `${BASE_TEXT}.`,
                withTextPadding({
                    fontSize: '14px',
                    color: '#333333',
                    align: 'center',
                    padding: {
                        top: 4,
                        bottom: 2,
                        left: 8,
                        right: 8
                    }
                })
            );

        this.label.setOrigin(0.5);

        this.container.add([this.bg, this.label]);
        this.container.setDepth(WORK_STATUS_DEPTH);
        this.container.setVisible(false);

        this.fitBackground();

        this.dotTimer =
            scene.time.addEvent({
                delay: DOT_INTERVAL_MS,
                loop: true,
                callback: () => this.tickDots()
            });
    }

    tickDots()
    {
        if (!this.container.visible)
        {
            return;
        }

        this.dotIndex = (this.dotIndex + 1) % 3;

        this.label.setText(
            `${BASE_TEXT}${'.'.repeat(this.dotIndex + 1)}`
        );

        this.fitBackground();
    }

    fitBackground()
    {
        const padX = 12;
        const padY = 4;
        const width = this.label.width + padX * 2;
        const height = this.label.height + padY * 2;

        this.bg.setSize(width, height);
    }

    setActive(active)
    {
        const shouldShow = Boolean(active);

        if (shouldShow && !this.container.visible)
        {
            this.dotIndex = 0;
            this.label.setText(`${BASE_TEXT}.`);
            this.fitBackground();
        }

        this.container.setVisible(shouldShow);

        if (shouldShow)
        {
            this.syncPosition();
        }
    }

    syncPosition()
    {
        this.container.setPosition(
            this.player.x,
            this.player.y + OFFSET_Y
        );

        this.container.setDepth(WORK_STATUS_DEPTH);
    }

    update()
    {
        if (!this.container.visible)
        {
            return;
        }

        this.syncPosition();
    }

    destroy()
    {
        if (this.dotTimer)
        {
            this.dotTimer.remove();
            this.dotTimer = null;
        }

        this.container?.destroy(true);
        this.container = null;
    }
}
