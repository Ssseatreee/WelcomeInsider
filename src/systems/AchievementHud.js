import * as Phaser from 'phaser';
import AchievementManager from './AchievementManager.js';
import {
    GAME_HEIGHT,
    PLAY_AREA_X
} from '../game/layout.js';

const MARGIN = 16;
const ICON_SIZE = 40;
const GAP = 8;

export default class AchievementHud
{
    constructor(scene)
    {
        this.scene = scene;
        this.icons = [];

        this.container =
            scene.add.container(
                PLAY_AREA_X + MARGIN,
                GAME_HEIGHT - 56
            );

        this.container.setScrollFactor(0);
        this.container.setDepth(900);

        this.refresh();
    }

    refresh()
    {
        this.icons.forEach(entry => entry.destroy());
        this.icons = [];
        this.container.removeAll(true);

        const unlocked =
            AchievementManager.getUnlockedList();

        if (!unlocked.length)
        {
            this.container.setVisible(false);
            return;
        }

        this.container.setVisible(true);

        unlocked.forEach((achievement, index) =>
        {
            const x =
                index * (ICON_SIZE + GAP)
                + ICON_SIZE / 2;
            const y = -ICON_SIZE / 2;

            const bg =
                this.scene.add.rectangle(
                    x,
                    y,
                    ICON_SIZE + 4,
                    ICON_SIZE + 4,
                    0x111111,
                    0.85
                );

            bg.setStrokeStyle(1, 0x666666, 0.9);
            this.container.add(bg);

            if (
                !this.scene.textures.exists(
                    achievement.textureKey
                )
            )
            {
                return;
            }

            const icon =
                this.scene.add.image(
                    x,
                    y,
                    achievement.textureKey
                );

            this.fitIcon(icon, ICON_SIZE);
            this.container.add(icon);

            this.icons.push(bg, icon);
        });
    }

    fitIcon(icon, maxSize)
    {
        const frame = icon.frame;

        if (!frame)
        {
            return;
        }

        icon.setScale(
            Math.min(
                maxSize / frame.width,
                maxSize / frame.height,
                1.5
            )
        );
    }
}
