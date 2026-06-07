import AudioSettings from './AudioSettings.js';
import * as Phaser from 'phaser';
import {
    withButtonTextStyle,
    withTextPadding
} from '../data/textStyle.js';
import { bindButtonSfx } from './Sfx.js';

class VolumeSlider
{
    constructor(
        scene,
        x,
        y,
        width,
        label,
        getValue,
        setValue
    )
    {
        this.scene = scene;
        this.getValue = getValue;
        this.setValue = setValue;
        this.width = width;
        this.dragging = false;

        this.container =
            scene.add.container(x, y);

        this.labelText =
            scene.add.text(
                0,
                0,
                label,
                withTextPadding({
                    fontSize: '14px',
                    color: '#d4c8b8'
                })
            );

        this.labelText.setOrigin(0, 0.5);

        const trackY = 22;
        const trackH = 8;

        this.track =
            scene.add.rectangle(
                width / 2,
                trackY,
                width,
                trackH,
                0x333333
            );

        this.track.setOrigin(0.5);

        this.fill =
            scene.add.rectangle(
                0,
                trackY,
                0,
                trackH,
                0x8a7f72
            );

        this.fill.setOrigin(0, 0.5);

        this.hitZone =
            scene.add.rectangle(
                width / 2,
                trackY,
                width,
                24,
                0x000000,
                0
            );

        this.hitZone.setOrigin(0.5);
        this.hitZone.setInteractive({
            useHandCursor: true
        });

        this.container.add([
            this.labelText,
            this.track,
            this.fill,
            this.hitZone
        ]);

        this.hitZone.on('pointerdown', pointer =>
        {
            this.dragging = true;
            this.updateFromPointer(pointer);
        });

        this._onPointerMove = pointer =>
        {
            if (!this.dragging)
            {
                return;
            }

            this.updateFromPointer(pointer);
        };

        this._onPointerUp = () =>
        {
            this.dragging = false;
        };

        scene.input.on(
            'pointermove',
            this._onPointerMove
        );

        scene.input.on(
            'pointerup',
            this._onPointerUp
        );

        this.refresh();
    }

    updateFromPointer(pointer)
    {
        const bounds =
            this.hitZone.getBounds();

        const t = Phaser.Math.Clamp(
            (pointer.x - bounds.left) / bounds.width,
            0,
            1
        );

        this.setValue(t);
        this.refresh();
    }

    refresh()
    {
        const value = this.getValue();
        const fillWidth = Math.max(2, this.width * value);

        this.fill.width = fillWidth;
        this.fill.x = 0;
    }

    destroy()
    {
        this.scene.input.off(
            'pointermove',
            this._onPointerMove
        );

        this.scene.input.off(
            'pointerup',
            this._onPointerUp
        );

        this.container.destroy(true);
    }
}

export default class VolumeSettingsPanel
{
    constructor(scene, options = {})
    {
        const {
            centerX = scene.scale.width / 2,
            topY = 0,
            width = 320,
            visible = true,
            depth = 602,
            showTitle = true,
            title = '音量设置'
        } = options;

        this.scene = scene;
        this.visible = visible;
        this.sliders = [];

        this.container =
            scene.add.container(centerX, topY);

        this.container.setScrollFactor(0);
        this.container.setDepth(depth);
        this.container.setVisible(visible);

        const panelHeight =
            showTitle ? 118 : 96;

        const bg =
            scene.add.rectangle(
                0,
                panelHeight / 2,
                width + 24,
                panelHeight,
                0x111111,
                0.95
            );

        bg.setStrokeStyle(1, 0x444444);
        this.container.add(bg);

        let sliderY = showTitle ? 34 : 18;

        if (showTitle)
        {
            const titleText =
                scene.add.text(
                    0,
                    14,
                    title,
                    withTextPadding({
                        fontSize: '16px',
                        color: '#ffffff'
                    })
                );

            titleText.setOrigin(0.5, 0);
            this.container.add(titleText);
        }

        const sliderWidth = width - 40;
        const sliderLeft = -sliderWidth / 2;

        this.sliders.push(
            new VolumeSlider(
                scene,
                sliderLeft,
                sliderY,
                sliderWidth,
                'BGM',
                () => AudioSettings.getBgmVolume(),
                value => AudioSettings.setBgmVolume(value)
            )
        );

        sliderY += 44;

        this.sliders.push(
            new VolumeSlider(
                scene,
                sliderLeft,
                sliderY,
                sliderWidth,
                '音效',
                () => AudioSettings.getSfxVolume(),
                value => AudioSettings.setSfxVolume(value)
            )
        );

        this.sliders.forEach(slider =>
        {
            slider.container.setScrollFactor(0);
            this.container.add(slider.container);
        });
    }

    setVisible(visible)
    {
        this.visible = visible;
        this.container.setVisible(visible);
    }

    toggle()
    {
        this.setVisible(!this.visible);
    }

    destroy()
    {
        this.sliders.forEach(slider => slider.destroy());
        this.sliders = [];
        this.container.destroy(true);
    }
}

const HUD_BUTTON_STYLE = withButtonTextStyle({
    fontSize: '18px',
    color: '#f5f0e8',
    backgroundColor: 'rgba(20, 16, 12, 0.55)',
    padding: {
        left: 10,
        right: 10,
        top: 12,
        bottom: 10
    }
});

const HUD_BUTTON_HOVER = {
    backgroundColor: 'rgba(48, 38, 28, 0.72)',
    color: '#fff8ee'
};

function styleHudButton(button)
{
    button.on('pointerover', () =>
    {
        button.setStyle(HUD_BUTTON_HOVER);
    });

    button.on('pointerout', () =>
    {
        button.setStyle({
            backgroundColor:
                HUD_BUTTON_STYLE.backgroundColor,
            color: HUD_BUTTON_STYLE.color
        });
    });
}

/** 关卡左侧 HUD：返回 + 设置（小地图上方） */
export function createLevelHudVolumeControls(
    scene,
    options = {}
)
{
    const {
        panelTop,
        panelWidth,
        panelLeft = 0
    } = options;

    const rowY = panelTop - 28;
    const backX = panelLeft + 52;
    const settingsX = panelLeft + panelWidth - 52;

    const backButton =
        scene.add.text(
            backX,
            rowY,
            '← 返回',
            HUD_BUTTON_STYLE
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(601)
        .setInteractive({ useHandCursor: true });

    styleHudButton(backButton);
    bindButtonSfx(backButton, scene);

    const settingsButton =
        scene.add.text(
            settingsX,
            rowY,
            '设置',
            HUD_BUTTON_STYLE
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(601)
        .setInteractive({ useHandCursor: true });

    styleHudButton(settingsButton);
    bindButtonSfx(settingsButton, scene);

    const volumePanel =
        new VolumeSettingsPanel(scene, {
            centerX: panelLeft + panelWidth / 2,
            topY: rowY + 34,
            width: panelWidth - 28,
            visible: false,
            depth: 605,
            showTitle: false
        });

    return {
        backButton,
        settingsButton,
        volumePanel
    };
}
