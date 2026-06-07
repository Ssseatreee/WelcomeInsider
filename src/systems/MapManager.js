// src/systems/MapManager.js
import * as Phaser from 'phaser';
import NavigationGrid from './NavigationGrid.js';

export default class MapManager {
    constructor(scene) {
        this.scene = scene;
        this.currentMapKey = null;
        this.map = null;
        this.layers = {};
        this.portals = [];
        this.objects = [];
        this.wallLayer = null;
        this.topLayer = [];

        this.tileBodies = [];
        this.navigationGrid = null;
    }

    collectTilesets(map, mapKey)
    {
        const tilesets = [];
        const rawTilesets = this.getRawTilesets(mapKey);

        map.tilesets.forEach((ts) =>
        {
            if (ts.source && !ts.image && !ts.tiles?.length)
            {
                console.warn(
                    `Skipping external tileset: ${ts.source}`
                );
                return;
            }

            let tileset = null;

            if (
                !this.isImagePathTileset(ts)
                && this.isCollectionTileset(ts, rawTilesets)
            )
            {
                this.hydrateCollectionTileset(ts, rawTilesets);
                this.normalizeCollectionTileImages(
                    ts,
                    rawTilesets
                );
                tileset = map.addTilesetImage(ts.name);
            }
            else if (this.isImagePathTileset(ts))
            {
                const textureKey =
                    this.resolveTextureKeyFromPath(ts.name);

                if (
                    !textureKey
                    || !this.scene.textures.exists(textureKey)
                )
                {
                    console.warn(
                        `Missing image tileset texture for "${ts.name}"`
                    );
                }

                tileset = map.addTilesetImage(
                    ts.name,
                    textureKey,
                    ts.tileWidth,
                    ts.tileHeight,
                    ts.margin,
                    ts.spacing
                );
            }
            else
            {
                const textureKey =
                    this.resolveTilesetTextureKey(
                        ts,
                        rawTilesets
                    );

                if (!this.scene.textures.exists(textureKey))
                {
                    console.warn(
                        `Missing tileset texture "${textureKey}" for "${ts.name}"`
                    );
                }

                tileset = map.addTilesetImage(
                    ts.name,
                    textureKey,
                    ts.tileWidth,
                    ts.tileHeight,
                    ts.margin,
                    ts.spacing
                );
            }

            if (tileset)
            {
                tilesets.push(tileset);
            }
        });

        return tilesets;
    }

    getRawTilesets(mapKey)
    {
        const entry = this.scene.cache.tilemap.get(mapKey);

        if (!entry?.data?.tilesets)
        {
            return [];
        }

        return entry.data.tilesets;
    }

    /**
     * 为离屏 NPC 预建导航网格（不渲染、不生成 Matter 碰撞体）
     */
    warmNavigationGrid(mapKey)
    {
        const map =
            this.scene.make.tilemap({ key: mapKey });

        const tilesets = this.collectTilesets(map, mapKey);
        const layers = {};

        map.layers.forEach(layerData =>
        {
            const layer =
                map.createLayer(
                    layerData.name,
                    tilesets,
                    0,
                    0
                );

            if (layer)
            {
                layer.setCollisionByProperty({
                    collides: true
                });

                if (
                    typeof layer.setCollisionFromCollisionGroup
                    === 'function'
                )
                {
                    layer.setCollisionFromCollisionGroup(true);
                }

                layers[layerData.name] = layer;
            }
        });

        NavigationGrid.getOrCreate(
            map,
            layers,
            true
        );

        Object.values(layers).forEach(layer => layer.destroy());
        map.destroy();
    }

    loadMap(mapKey) {
        // 防止重复加载
        if (this.currentMapKey === mapKey) return;

        // 清理旧地图
        this.clearCurrentMap();

        this.currentMapKey = mapKey;

        // 创建 tilemap
        this.map = this.scene.make.tilemap({ key: mapKey });

        const tilesets = this.collectTilesets(this.map, mapKey);
        

        // 计算偏移
        // this.offsetX = (this.scene.scale.width - this.map.widthInPixels) / 2;
        // this.offsetY = (this.scene.scale.height - this.map.heightInPixels) / 2;
        this.offsetX=this.scene.scale.width/2;
        this.offsetY=this.scene.scale.height/2;

        // 遍历 tilemap 中所有图层
        this.map.layers.forEach(layerData => {
            // if(layerData.type!=='tilelayer')
            //     return;

            const name = layerData.name;
            // 使用第一个 tileset 创建图层
            // const layer = this.map.createLayer(name, tilesets, this.offsetX, this.offsetY);
            const layer = this.map.createLayer(name, tilesets, 0, 0);
            // 自动保存到 this.layers，key = layer name
            this.layers[name] = layer;

            // ===== 转换前记录 world bodies =====
            const beforeBodies =
                Phaser.Physics.Matter.Matter.Composite.allBodies(
                    this.scene.matter.world.localWorld
                );

            // ===== Tilemap -> Matter =====
            layer.setCollisionByProperty({
                collides: true
            });

            if (typeof layer.setCollisionFromCollisionGroup === 'function')
            {
                layer.setCollisionFromCollisionGroup(true);
            }

            this.scene.matter.world.convertTilemapLayer(
                layer
            );

            // ===== 转换后记录新增 bodies =====
            const afterBodies =
                Phaser.Physics.Matter.Matter.Composite.allBodies(
                    this.scene.matter.world.localWorld
                );

            // 新增的 body 就是 tilemap body
            const newBodies =
                afterBodies.filter(
                    body => !beforeBodies.includes(body)
                );

            // 保存
            this.tileBodies.push(...newBodies);
            // );

            // top层记录
            // 初始化 topLayer 数组
            if (!this.topLayer) this.topLayer = [];

            // 所有以 top 开头的图层都加入 topLayer
            if (/^top\d*$/.test(name)) {
                this.topLayer.push(layer);
            }
            // if (name === 'Walls') this.wallLayer = layer;
        });


        // 读取对象层
        this.portals = this.getObjectLayer('portals')?.objects || [];
        this.objects = this.getObjectLayer('objects')?.objects || [];

        // 平移所有对象层的对象
        // this.portals.forEach(obj => {
        //     obj.x += this.offsetX;
        //     obj.y += this.offsetY;
        // });
        // this.objects.forEach(obj => {
        //     obj.x += this.offsetX;
        //     obj.y += this.offsetY;
        // });

        this.navigationGrid =
            NavigationGrid.getOrCreate(
                this.map,
                this.layers,
                true
            );

        console.log(`Loaded map: ${mapKey}`);
        console.log('objects:', this.objects);
        console.log(this.map.heightInPixels);
    }

    clearCurrentMap()
    {
        Object.values(this.layers).forEach(layer =>
        {
            if (!layer)
            {
                return;
            }

            if (typeof layer.forEachTile === 'function')
            {
                layer.forEachTile(tile =>
                {
                    const matterBody =
                        tile.physics?.matterBody;

                    if (matterBody)
                    {
                        matterBody.destroy();
                    }
                });
            }

            if (layer.body)
            {
                this.scene.matter.world.remove(
                    layer.body,
                    true
                );
            }

            layer.destroy();
        });

        this.tileBodies.forEach(body =>
        {
            this.scene.matter.world.remove(body, true);
        });

        this.tileBodies = [];

        if (this.map)
        {
            this.map.destroy();
            this.map = null;
        }

        this.layers = {};
        this.portals = [];
        this.objects = [];
        this.wallLayer = null;
        this.topLayer = null;
        this.currentMapKey = null;
        this.navigationGrid = null;
    }

    getObjectLayer(layerName) {
        if (!this.map) return null;
        return this.map.getObjectLayer(layerName);
    }

    getMapWidth() {
        return this.map ? this.map.widthInPixels : 0;
    }

    getMapHeight() {
        return this.map ? this.map.heightInPixels : 0;
    }

    resolveTilesetTextureKey(tsOrName, rawTilesets = [])
    {
        const name =
            typeof tsOrName === 'string'
                ? tsOrName
                : tsOrName.name;

        const imagePath =
            this.getTilesetImagePath(
                tsOrName,
                rawTilesets
            )
            || (this.isImagePathString(name) ? name : null);

        if (imagePath)
        {
            const textureKey =
                this.resolveTextureKeyFromPath(imagePath);

            if (textureKey)
            {
                return textureKey;
            }
        }

        const prefixed = `tileset-${name}`;

        if (this.scene.textures.exists(prefixed))
        {
            return prefixed;
        }

        if (this.scene.textures.exists(name))
        {
            return name;
        }

        return prefixed;
    }

    isImagePathTileset(ts)
    {
        return this.isImagePathString(ts?.name);
    }

    isImagePathString(value)
    {
        if (typeof value !== 'string')
        {
            return false;
        }

        return (
            /[\\/]/.test(value)
            && /\.(png|jpe?g|webp)$/i.test(value)
        );
    }

    resolveTextureKeyFromPath(imagePath)
    {
        if (typeof imagePath !== 'string')
        {
            return null;
        }

        const fileName =
            imagePath
                .replace(/\\/g, '/')
                .split('/')
                .pop();

        if (!fileName)
        {
            return null;
        }

        if (this.scene.textures.exists(fileName))
        {
            return fileName;
        }

        const imageBase =
            fileName.replace(/\.(png|jpe?g|webp)$/i, '');
        const tilesetKey = `tileset-${imageBase}`;

        if (this.scene.textures.exists(tilesetKey))
        {
            return tilesetKey;
        }

        return null;
    }

    getTilesetImagePath(tsOrName, rawTilesets = [])
    {
        if (typeof tsOrName === 'string')
        {
            return null;
        }

        if (typeof tsOrName.image === 'string')
        {
            return tsOrName.image;
        }

        if (this.isImagePathString(tsOrName.name))
        {
            return tsOrName.name;
        }

        const rawMatch = rawTilesets.find(entry =>
            entry.firstgid === tsOrName.firstgid
            || entry.name === tsOrName.name
        );

        if (typeof rawMatch?.image === 'string')
        {
            return rawMatch.image;
        }

        return null;
    }

    textureKeyFromImagePath(imagePath)
    {
        return this.resolveTextureKeyFromPath(imagePath);
    }

    hydrateCollectionTileset(ts, rawTilesets = [])
    {
        const raw = rawTilesets.find(entry =>
            entry.firstgid === ts.firstgid
            || entry.name === ts.name
        );

        if (!raw?.tiles?.length)
        {
            return;
        }

        const needsHydration =
            !ts.tiles?.length
            || !ts.tiles.some(tile =>
                typeof tile.image === 'string'
            );

        if (needsHydration)
        {
            ts.tiles = raw.tiles.map(tile => ({ ...tile }));
        }
    }

    isCollectionTileset(ts, rawTilesets = [])
    {
        if (ts.tiles?.some(tile => tile.image))
        {
            return true;
        }

        const raw = rawTilesets.find(entry =>
            entry.firstgid === ts.firstgid
            || entry.name === ts.name
        );

        return Boolean(
            raw?.tiles?.some(tile => tile.image)
        );
    }

    normalizeCollectionTileImages(ts, rawTilesets = [])
    {
        const raw = rawTilesets.find(entry =>
            entry.firstgid === ts.firstgid
            || entry.name === ts.name
        );
        const rawTiles = raw?.tiles || [];

        ts.tiles.forEach(tile =>
        {
            let imagePath = null;

            if (typeof tile.image === 'string')
            {
                imagePath = tile.image;
            }
            else
            {
                const rawTile =
                    rawTiles.find(entry => entry.id === tile.id);

                if (typeof rawTile?.image === 'string')
                {
                    imagePath = rawTile.image;
                }
            }

            if (!imagePath)
            {
                return;
            }

            const fileName =
                imagePath
                    .replace(/\\/g, '/')
                    .split('/')
                    .pop();

            tile.image = fileName;

            if (!this.scene.textures.exists(fileName))
            {
                console.warn(
                    `Missing collection tile texture "${fileName}"`
                    + ` for tileset "${ts.name}"`
                );
            }
        });
    }
}