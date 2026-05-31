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

    collectTilesets(map)
    {
        const tilesets = [];

        map.tilesets.forEach(ts =>
        {
            if (ts.source && !ts.image && !ts.tiles?.length)
            {
                console.warn(
                    `Skipping external tileset: ${ts.source}`
                );
                return;
            }

            let tileset = null;

            if (this.isCollectionTileset(ts))
            {
                this.normalizeCollectionTileImages(ts);
                tileset = map.addTilesetImage(ts.name);
            }
            else
            {
                const textureKey =
                    this.resolveTilesetTextureKey(ts.name);

                if (!this.scene.textures.exists(textureKey))
                {
                    console.warn(
                        `Missing tileset texture "${textureKey}" for "${ts.name}"`
                    );
                }

                tileset = map.addTilesetImage(
                    ts.name,
                    textureKey
                );
            }

            if (tileset)
            {
                tilesets.push(tileset);
            }
        });

        return tilesets;
    }

    /**
     * 为离屏 NPC 预建导航网格（不渲染、不生成 Matter 碰撞体）
     */
    warmNavigationGrid(mapKey)
    {
        if (NavigationGrid.get(mapKey))
        {
            return;
        }

        const map =
            this.scene.make.tilemap({ key: mapKey });

        const tilesets = this.collectTilesets(map);
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

        NavigationGrid.getOrCreate(map, layers);

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

        const tilesets = this.collectTilesets(this.map);
        

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

    resolveTilesetTextureKey(name)
    {
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

    isCollectionTileset(ts)
    {
        return Boolean(
            ts.tiles?.some(tile => tile.image)
        );
    }

    normalizeCollectionTileImages(ts)
    {
        ts.tiles.forEach(tile => {

            if (!tile.image)
            {
                return;
            }

            tile.image =
                tile.image
                    .replace(/\\/g, '/')
                    .split('/')
                    .pop();
        });
    }
}