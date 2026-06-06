import workBacklogConfig from '../data/workBacklogConfig.js';
import { resolveItem } from '../data/items.js';
import GameState from './GameState.js';
import * as Phaser from 'phaser';
import {
    GAME_HEIGHT,
    HUD_WIDTH,
    PLAY_AREA_WIDTH
} from '../game/layout.js';
import { withTextPadding } from '../data/textStyle.js';

export default class ItemInventoryPanel
{
    constructor(scene)
    {
        this.scene = scene;
        this.slotViews = [];
        this.activeSlot = null;

        const {
            panelWidth,
            panelHeight,
            panelOffsetLeft = 32,
            panelOffsetTop = 100,
            itemPanel = {}
        } = workBacklogConfig;

        const itemGap = itemPanel.gap ?? 10;
        const columns = itemPanel.columns ?? 4;
        const iconSize = itemPanel.iconSize ?? 48;
        const cellGap = itemPanel.cellGap ?? 10;
        const labelHeight = itemPanel.labelHeight ?? 18;
        const labelFontSize = itemPanel.labelFontSize ?? '14px';
        const detailFontSize = itemPanel.detailFontSize ?? '13px';
        const gridTopOffset = itemPanel.gridTopOffset ?? 0;

        this.panelLeft =
            panelOffsetLeft
            ?? Math.max(
                8,
                (HUD_WIDTH - panelWidth) / 2
            );

        this.panelTop =
            panelOffsetTop + panelHeight + itemGap;

        this.panelWidth = panelWidth;
        this.panelHeight =
            GAME_HEIGHT - this.panelTop - 12;

        this.columns = columns;
        this.iconSize = iconSize;
        this.cellGap = cellGap;
        this.labelHeight = labelHeight;
        this.labelFontSize = labelFontSize;
        this.detailFontSize = detailFontSize;
        this.detailWrapWidth = panelWidth - 48;

        this.container =
            scene.add.container(0, 0);

        this.container.setScrollFactor(0);
        this.container.setDepth(595);

        const bg =
            scene.add.rectangle(
                this.panelLeft + panelWidth / 2,
                this.panelTop + this.panelHeight / 2,
                panelWidth,
                this.panelHeight,
                0x111111,
                0.95
            );

        bg.setStrokeStyle(1, 0x444444);
        bg.setScrollFactor(0);
        this.container.add(bg);

        this.titleText =
            scene.add.text(
                this.panelLeft + panelWidth / 2,
                this.panelTop + 16,
                itemPanel.title ?? '物品',
                withTextPadding({
                    fontSize: '20px',
                    color: '#ffffff'
                })
            );

        this.titleText.setOrigin(0.5, 0);
        this.titleText.setScrollFactor(0);
        this.container.add(this.titleText);

        this.emptyText =
            scene.add.text(
                this.panelLeft + panelWidth / 2,
                this.panelTop + 56,
                '暂无物品',
                withTextPadding({
                    fontSize: '16px',
                    color: '#666666'
                })
            );

        this.emptyText.setOrigin(0.5, 0);
        this.emptyText.setScrollFactor(0);
        this.container.add(this.emptyText);

        this.slotsContainer =
            scene.add.container(0, 0);

        this.slotsContainer.setScrollFactor(0);
        this.container.add(this.slotsContainer);

        this.gridTop = this.panelTop + 44 + gridTopOffset;
        this.gridLeft =
            this.panelLeft +
            (panelWidth - (
                columns * iconSize +
                (columns - 1) * cellGap
            )) / 2;

        this.detailOverlay =
            scene.add.container(0, 0);

        this.detailOverlay.setScrollFactor(0);
        this.detailOverlay.setDepth(1500);
        this.detailOverlay.setVisible(false);

        this.floatingDetailBg =
            scene.add.rectangle(
                0,
                0,
                this.detailWrapWidth,
                10,
                0x1a1a1a,
                0.98
            );

        this.floatingDetailBg.setStrokeStyle(1, 0x555555);
        this.floatingDetailBg.setScrollFactor(0);
        this.detailOverlay.add(this.floatingDetailBg);

        this.floatingDetailText =
            scene.add.text(
                0,
                0,
                '',
                withTextPadding({
                    fontSize: this.detailFontSize,
                    color: '#dddddd',
                    align: 'left',
                    wordWrap: {
                        width: this.detailWrapWidth - 24,
                        useAdvancedWrap: true
                    },
                    lineSpacing: 6
                })
            );

        this.floatingDetailText.setOrigin(0.5, 0);
        this.floatingDetailText.setScrollFactor(0);
        this.detailOverlay.add(this.floatingDetailText);

        this.refresh();
    }

    createSlotView(index)
    {
        const col = index % this.columns;
        const row = Math.floor(index / this.columns);

        const x =
            this.gridLeft +
            col * (this.iconSize + this.cellGap) +
            this.iconSize / 2;

        const y =
            this.gridTop +
            row * (
                this.iconSize +
                this.cellGap +
                this.labelHeight
            ) +
            this.iconSize / 2;

        const slotContainer =
            this.scene.add.container(x, y);

        slotContainer.setScrollFactor(0);

        const frame =
            this.scene.add.rectangle(
                0,
                0,
                this.iconSize + 4,
                this.iconSize + 4,
                0x000000,
                0
            );

        frame.setStrokeStyle(1, 0x333333);
        frame.setScrollFactor(0);
        slotContainer.add(frame);

        const icon =
            this.scene.add.image(0, 0, 'item-coffee');

        icon.setScrollFactor(0);
        slotContainer.add(icon);

        const label =
            this.scene.add.text(
                0,
                this.iconSize / 2 + 4,
                '',
                withTextPadding({
                    fontSize: this.labelFontSize,
                    color: '#aaaaaa',
                    align: 'center',
                    wordWrap: {
                        width: this.iconSize + 12
                    }
                })
            );

        label.setOrigin(0.5, 0);
        label.setScrollFactor(0);
        slotContainer.add(label);

        const hitHeight =
            this.iconSize +
            this.labelHeight +
            12;

        const hitArea =
            this.scene.add.rectangle(
                0,
                this.labelHeight / 2,
                this.iconSize + 12,
                hitHeight,
                0x000000,
                0
            );

        hitArea.setScrollFactor(0);
        hitArea.setInteractive({
            useHandCursor: true
        });

        slotContainer.add(hitArea);
        this.slotsContainer.add(slotContainer);

        const slot = {
            container: slotContainer,
            frame,
            icon,
            label,
            hitArea,
            item: null,
            expanded: false,
            collapseTimer: null
        };

        hitArea.on('pointerover', () =>
        {
            this.expandSlot(slot);
        });

        hitArea.on('pointerout', () =>
        {
            this.scheduleCollapseSlot(slot);
        });

        return slot;
    }

    scheduleCollapseSlot(slot)
    {
        if (slot.collapseTimer)
        {
            slot.collapseTimer.remove();
        }

        slot.collapseTimer =
            this.scene.time.delayedCall(30, () =>
            {
                slot.collapseTimer = null;

                if (this.activeSlot === slot)
                {
                    this.collapseSlot(slot);
                }
            });
    }

    cancelCollapseSlot(slot)
    {
        if (slot.collapseTimer)
        {
            slot.collapseTimer.remove();
            slot.collapseTimer = null;
        }
    }

    positionFloatingDetail(slotY, detailHeight)
    {
        const textPadding = 20;
        const detailX =
            PLAY_AREA_WIDTH
            - this.detailWrapWidth / 2
            - 16;

        let detailTop =
            slotY
            - this.iconSize / 2
            - this.labelHeight;

        const maxTop =
            GAME_HEIGHT - detailHeight - 12;

        detailTop =
            Phaser.Math.Clamp(
                detailTop,
                12,
                maxTop
            );

        const centerY =
            detailTop + detailHeight / 2;

        this.floatingDetailText.setPosition(
            detailX,
            detailTop + textPadding
        );

        this.floatingDetailBg.setPosition(
            detailX,
            centerY
        );

        this.floatingDetailBg.setSize(
            this.detailWrapWidth,
            detailHeight
        );
    }

    expandSlot(slot)
    {
        if (
            !slot.item
            ||
            !slot.item.description
        )
        {
            return;
        }

        if (this.activeSlot === slot)
        {
            return;
        }

        this.scene.tweens.killTweensOf([
            this.floatingDetailBg,
            this.floatingDetailText
        ]);

        if (this.activeSlot)
        {
            this.cancelCollapseSlot(this.activeSlot);
            this.activeSlot.expanded = false;
            this.activeSlot.frame.setStrokeStyle(1, 0x333333);
        }

        slot.expanded = true;
        this.activeSlot = slot;

        slot.frame.setStrokeStyle(2, 0x888888);

        this.floatingDetailText.setText(slot.item.description);
        this.floatingDetailText.setWordWrapWidth(
            this.detailWrapWidth - 24,
            true
        );

        const textPadding = 20;
        const detailHeight =
            this.floatingDetailText.height + textPadding * 2;

        this.positionFloatingDetail(
            slot.container.y,
            detailHeight
        );

        this.detailOverlay.setVisible(true);
        this.floatingDetailBg.setAlpha(1);
        this.floatingDetailText.setAlpha(1);
    }

    collapseSlot(slot)
    {
        if (!slot?.expanded)
        {
            return;
        }

        this.cancelCollapseSlot(slot);

        slot.expanded = false;

        if (this.activeSlot === slot)
        {
            this.activeSlot = null;
        }

        slot.frame.setStrokeStyle(1, 0x333333);

        if (!this.activeSlot)
        {
            this.scene.tweens.killTweensOf([
                this.floatingDetailBg,
                this.floatingDetailText
            ]);

            this.scene.tweens.add({
                targets: [
                    this.floatingDetailBg,
                    this.floatingDetailText
                ],
                alpha: 0,
                duration: 120,
                ease: 'Sine.easeIn',
                onComplete: () =>
                {
                    if (!this.activeSlot)
                    {
                        this.detailOverlay.setVisible(false);
                    }
                }
            });
        }
    }

    refresh()
    {
        this.scene.tweens.killTweensOf([
            this.floatingDetailBg,
            this.floatingDetailText
        ]);

        this.detailOverlay.setVisible(false);
        this.floatingDetailBg.setAlpha(1);
        this.floatingDetailText.setAlpha(1);

        this.slotViews.forEach(slot =>
        {
            this.cancelCollapseSlot(slot);

            if (slot.expanded)
            {
                slot.expanded = false;
                slot.frame.setStrokeStyle(1, 0x333333);
            }
        });

        this.activeSlot = null;

        const collected =
            GameState.getInventoryItemIds()
                .map(itemId => resolveItem(itemId))
                .filter(Boolean);

        while (this.slotViews.length < collected.length)
        {
            this.slotViews.push(
                this.createSlotView(this.slotViews.length)
            );
        }

        this.slotViews.forEach((slot, index) =>
        {
            const item = collected[index];

            if (!item)
            {
                slot.container.setVisible(false);
                slot.item = null;
                return;
            }

            slot.container.setVisible(true);
            slot.item = item;

            const col = index % this.columns;
            const row = Math.floor(index / this.columns);
            const x =
                this.gridLeft +
                col * (this.iconSize + this.cellGap) +
                this.iconSize / 2;
            const y =
                this.gridTop +
                row * (
                    this.iconSize +
                    this.cellGap +
                    this.labelHeight
                ) +
                this.iconSize / 2;

            slot.container.setPosition(x, y);

            if (this.scene.textures.exists(item.textureKey))
            {
                slot.icon.setTexture(item.textureKey);
                slot.icon.setVisible(true);
            }
            else
            {
                slot.icon.setVisible(false);
            }

            this.fitIcon(slot.icon);
            slot.label.setText(item.name);
        });

        this.emptyText.setVisible(collected.length === 0);
    }

    fitIcon(icon)
    {
        const frame = icon.frame;

        if (!frame)
        {
            return;
        }

        const scale = Math.min(
            (this.iconSize - 4) / frame.width,
            (this.iconSize - 4) / frame.height,
            1.35
        );

        icon.setScale(scale);
    }
}
