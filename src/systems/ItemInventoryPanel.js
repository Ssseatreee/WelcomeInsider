import workBacklogConfig from '../data/workBacklogConfig.js';
import { resolveItem } from '../data/items.js';
import GameState from './GameState.js';
import {
    GAME_HEIGHT,
    HUD_WIDTH
} from '../game/layout.js';

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
        this.detailWrapWidth = panelWidth - 40;

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
                {
                    fontSize: '20px',
                    color: '#ffffff'
                }
            );

        this.titleText.setOrigin(0.5, 0);
        this.titleText.setScrollFactor(0);
        this.container.add(this.titleText);

        this.emptyText =
            scene.add.text(
                this.panelLeft + panelWidth / 2,
                this.panelTop + 56,
                '暂无物品',
                {
                    fontSize: '16px',
                    color: '#666666'
                }
            );

        this.emptyText.setOrigin(0.5, 0);
        this.emptyText.setScrollFactor(0);
        this.container.add(this.emptyText);

        this.slotsContainer =
            scene.add.container(0, 0);

        this.slotsContainer.setScrollFactor(0);
        this.container.add(this.slotsContainer);

        this.gridTop = this.panelTop + 44;
        this.gridLeft =
            this.panelLeft +
            (panelWidth - (
                columns * iconSize +
                (columns - 1) * cellGap
            )) / 2;

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

        const detailBg =
            this.scene.add.rectangle(
                0,
                this.iconSize / 2 + this.labelHeight + 12,
                this.detailWrapWidth,
                10,
                0x1a1a1a,
                0.98
            );

        detailBg.setStrokeStyle(1, 0x555555);
        detailBg.setScrollFactor(0);
        detailBg.setVisible(false);
        detailBg.setAlpha(0);
        slotContainer.add(detailBg);

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
                {
                    fontSize: this.labelFontSize,
                    color: '#aaaaaa',
                    align: 'center',
                    wordWrap: {
                        width: this.iconSize + 12
                    }
                }
            );

        label.setOrigin(0.5, 0);
        label.setScrollFactor(0);
        slotContainer.add(label);

        const detailText =
            this.scene.add.text(
                0,
                this.iconSize / 2 + this.labelHeight + 18,
                '',
                {
                    fontSize: this.detailFontSize,
                    color: '#dddddd',
                    align: 'center',
                    wordWrap: {
                        width: this.detailWrapWidth - 20
                    },
                    lineSpacing: 4
                }
            );

        detailText.setOrigin(0.5, 0);
        detailText.setScrollFactor(0);
        detailText.setVisible(false);
        detailText.setAlpha(0);
        slotContainer.add(detailText);

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
            detailBg,
            detailText,
            hitArea,
            item: null,
            expanded: false
        };

        hitArea.on('pointerover', () =>
        {
            this.expandSlot(slot);
        });

        hitArea.on('pointerout', () =>
        {
            this.collapseSlot(slot);
        });

        return slot;
    }

    expandSlot(slot)
    {
        if (
            !slot.item
            ||
            slot.expanded
            ||
            !slot.item.description
        )
        {
            return;
        }

        if (
            this.activeSlot
            &&
            this.activeSlot !== slot
        )
        {
            this.collapseSlot(this.activeSlot);
        }

        slot.expanded = true;
        this.activeSlot = slot;

        this.slotsContainer.bringToTop(slot.container);

        slot.detailText.setText(slot.item.description);
        slot.detailText.setVisible(true);

        const detailHeight =
            slot.detailText.height + 24;

        slot.detailBg.setSize(
            this.detailWrapWidth,
            detailHeight
        );

        slot.detailBg.y =
            slot.detailText.y +
            detailHeight / 2 -
            12;

        slot.detailBg.setVisible(true);
        slot.frame.setStrokeStyle(2, 0x888888);

        this.scene.tweens.add({
            targets: [
                slot.detailBg,
                slot.detailText
            ],
            alpha: 1,
            duration: 160,
            ease: 'Sine.easeOut'
        });
    }

    collapseSlot(slot)
    {
        if (!slot?.expanded)
        {
            return;
        }

        slot.expanded = false;

        if (this.activeSlot === slot)
        {
            this.activeSlot = null;
        }

        slot.frame.setStrokeStyle(1, 0x333333);

        this.scene.tweens.add({
            targets: [
                slot.detailBg,
                slot.detailText
            ],
            alpha: 0,
            duration: 120,
            ease: 'Sine.easeIn',
            onComplete: () =>
            {
                slot.detailBg.setVisible(false);
                slot.detailText.setVisible(false);
            }
        });
    }

    refresh()
    {
        this.slotViews.forEach(slot =>
        {
            this.collapseSlot(slot);
        });

        this.activeSlot = null;

        const collected =
            GameState.collectedItems
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
            (this.iconSize - 6) / frame.width,
            (this.iconSize - 6) / frame.height,
            1
        );

        icon.setScale(scale);
    }
}
