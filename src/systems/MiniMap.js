import miniMapLayout from '../data/miniMapLayout.js';
import {
    GAME_HEIGHT
} from '../game/layout.js';

import GameState from './GameState.js';

export default class MiniMap
{
    constructor(scene, npcManager)
    {
        this.scene = scene;
        this.npcManager = npcManager;

        const {
            panelWidth,
            panelHeight,
            panelOffsetLeft = 0,
            npcDotRadius = 6,
            playerDotRadius = 5,
            playerDotColor = 0xffff66
        } = miniMapLayout;

        this.npcDotRadius = npcDotRadius;
        this.playerDotRadius = playerDotRadius;
        this.playerDotColor = playerDotColor;

        const panelLeft = panelOffsetLeft;

        const panelTop =
            Math.max(
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

        this.mapGraphics =
            scene.add.graphics();

        this.mapGraphics.setScrollFactor(0);
        this.container.add(this.mapGraphics);

        this.dotGraphics =
            scene.add.graphics();

        this.dotGraphics.setScrollFactor(0);
        this.container.add(this.dotGraphics);

        this.layoutRects = this.buildLayoutRects(
            panelLeft,
            panelTop
        );
    }

    buildLayoutRects(panelLeft, panelTop)
    {
        const rects = {};

        for (const [mapKey, layout] of Object.entries(
            miniMapLayout.maps
        ))
        {
            rects[mapKey] = {
                x: panelLeft + layout.x,
                y: panelTop + layout.y,
                w: layout.w,
                h: layout.h
            };
        }

        return rects;
    }

    getMapPixelSize(mapKey)
    {
        const entry =
            this.scene.cache.tilemap.get(mapKey);

        const mapData =
            entry?.data ?? entry;

        if (mapData)
        {
            const w =
                mapData.widthInPixels
                ?? mapData.width * mapData.tileWidth;

            const h =
                mapData.heightInPixels
                ?? mapData.height * mapData.tileHeight;

            if (w && h)
            {
                return { w, h };
            }
        }

        return (
            miniMapLayout.mapPixelSizes?.[mapKey]
            ?? null
        );
    }

    worldToMini(mapKey, worldX, worldY)
    {
        const layout =
            miniMapLayout.maps[mapKey];

        const rect =
            this.layoutRects[mapKey];

        const size =
            this.getMapPixelSize(mapKey);

        if (!layout || !rect || !size)
        {
            return null;
        }

        return {
            x:
                rect.x
                + (worldX / size.w) * layout.w,
            y:
                rect.y
                + (worldY / size.h) * layout.h
        };
    }

    update(currentMap, player)
    {
        this.drawMapRegions(currentMap);
        this.drawDots(currentMap, player);
    }

    drawMapRegions(currentMap)
    {
        const g = this.mapGraphics;

        g.clear();

        for (const [mapKey, rect] of Object.entries(
            this.layoutRects
        ))
        {
            const isCurrent =
                mapKey === currentMap;

            g.fillStyle(
                isCurrent ? 0x3a5068 : 0x1e1e1e,
                isCurrent ? 0.95 : 0.55
            );

            g.fillRect(rect.x, rect.y, rect.w, rect.h);

            g.lineStyle(
                1,
                isCurrent ? 0x88aacc : 0x444444,
                1
            );

            g.strokeRect(rect.x, rect.y, rect.w, rect.h);
        }
    }

    drawDots(currentMap, player)
    {
        const g = this.dotGraphics;

        g.clear();

        const revealAll =
            GameState.hasDroneReveal();

        for (const npc of this.npcManager.getAllNPCs())
        {
            if (npc.removed)
            {
                continue;
            }

            if (
                !revealAll
                &&
                !npc.hasEmpathy
            )
            {
                continue;
            }

            const pos =
                this.worldToMini(
                    npc.currentMap,
                    npc.worldX,
                    npc.worldY
                );

            if (!pos)
            {
                continue;
            }

            g.fillStyle(
                npc.minimapColor ?? 0xffffff,
                1
            );

            g.fillCircle(
                pos.x,
                pos.y,
                this.npcDotRadius
            );
        }

        const playerPos =
            this.worldToMini(
                currentMap,
                player.x,
                player.y
            );

        if (playerPos)
        {
            g.fillStyle(this.playerDotColor, 1);

            g.fillCircle(
                playerPos.x,
                playerPos.y,
                this.playerDotRadius
            );
        }
    }
}
